// routes/feedback.js — global app feedback and rating (contract v3.6.0)
//
// All three routes need MobileAnonymousBearer. The owner is the device in the
// token, never anything in the body: a body that tries to supply a device id,
// a platform or an app version is refused rather than ignored.
//
// One current feedback per device, like an app-store review: a later PUT
// replaces it and no history is kept. The platform and app version shown to
// staff are copied from the authenticated session and never reach the wire.

const express = require('express');
const { db, error, requireBearer } = require('../db');

const router = express.Router();

const MAX_COMMENT_LENGTH = 1000;
const ALLOWED_KEYS = new Set(['rating', 'comment']);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function findFeedback(deviceUuid) {
  return db.feedback.find(f => f.device_uuid === deviceUuid);
}

// Whitelist projection shared by GET and PUT.
function toResponse(row) {
  return {
    rating: row ? row.rating : null,
    comment: row ? row.comment : null,
    updated_at: row ? row.updated_at : null,
  };
}

// GET /feedback — the device's current feedback, or all-null when there is
// none. Always 200: "not given" is a state, not an error.
router.get('/', requireBearer, (req, res) => {
  return res.json(toResponse(findFeedback(req.auth.device_uuid)));
});

// PUT /feedback — create or replace the device's current feedback.
router.put('/', requireBearer, (req, res) => {
  const body = req.body;
  if (!isPlainObject(body)) {
    return error(res, 422, 'VALIDATION_ERROR', 'Request body must be a JSON object.');
  }

  const extra = Object.keys(body).find(key => !ALLOWED_KEYS.has(key));
  if (extra) {
    return error(res, 422, 'VALIDATION_ERROR', `Field '${extra}' is not accepted.`);
  }

  const { rating } = body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return error(res, 422, 'VALIDATION_ERROR', 'rating must be between 1 and 5.');
  }

  if (body.comment !== undefined && body.comment !== null && typeof body.comment !== 'string') {
    return error(res, 422, 'VALIDATION_ERROR', 'comment must be a string or null.');
  }
  // Trimmed by the server; the limit applies after trimming, and empty or
  // white-space-only text is stored as null.
  const trimmed = typeof body.comment === 'string' ? body.comment.trim() : '';
  const comment = trimmed.length > 0 ? trimmed : null;
  if (comment !== null && comment.length > MAX_COMMENT_LENGTH) {
    return error(res, 422, 'VALIDATION_ERROR', `comment must be at most ${MAX_COMMENT_LENGTH} characters.`);
  }

  const session = db.sessions.find(s => s.id === req.auth.session_id);
  const row = findFeedback(req.auth.device_uuid);

  if (row) {
    // An identical PUT changes nothing, updated_at included.
    if (row.rating !== rating || row.comment !== comment) {
      row.rating = rating;
      row.comment = comment;
      row.updated_at = new Date().toISOString();
      row.platform = session ? session.platform : null;
      row.app_version = session ? session.app_version : null;
    }
    return res.json(toResponse(row));
  }

  const created = {
    device_uuid: req.auth.device_uuid,
    rating,
    comment,
    updated_at: new Date().toISOString(),
    // Internal, for staff only.
    platform: session ? session.platform : null,
    app_version: session ? session.app_version : null,
  };
  db.feedback.push(created);
  return res.json(toResponse(created));
});

// DELETE /feedback — withdraw the device's feedback. Idempotent: 204 whether
// or not there was one.
router.delete('/', requireBearer, (req, res) => {
  db.feedback = db.feedback.filter(f => f.device_uuid !== req.auth.device_uuid);
  return res.status(204).end();
});

module.exports = router;
