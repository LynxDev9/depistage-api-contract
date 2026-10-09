// routes/notifications.js — in-app notifications (contract v3.7.0)
//
// GET /notifications is PUBLIC: no MobileAnonymousBearer. Nothing is pushed and
// nothing is stored per device; the app keeps its own read/unread state.
//
// Only PUBLISHED rows that are active now (starts_at <= now, ends_at null or
// later) in the requested language are returned, newest first, 20 at most,
// through a whitelist projection — `status` never leaves the server.

const express = require('express');
const { db, VALID, error } = require('../db');

const router = express.Router();

const MAX_ITEMS = 20;

function isActive(row, now) {
  if (row.status !== 'PUBLISHED') return false;
  if (Date.parse(row.starts_at) > now) return false;
  return row.ends_at === null || Date.parse(row.ends_at) > now;
}

function toNotification(row) {
  return {
    notification_id: row.notification_id,
    type: row.type,
    title: row.title,
    body: row.body,
    language: row.language,
    content_id: row.content_id,
    center_id: row.center_id,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    updated_at: row.updated_at,
  };
}

// GET /notifications?language=fr|ar
router.get('/', (req, res) => {
  const { language } = req.query;
  if (typeof language !== 'string' || !VALID.language.includes(language)) {
    return error(res, 422, 'VALIDATION_ERROR', 'language is required and must be fr or ar.');
  }

  const now = Date.now();
  const items = db.notifications
    .filter(row => row.language === language && isActive(row, now))
    .sort((a, b) =>
      Date.parse(b.starts_at) - Date.parse(a.starts_at) ||
      b.notification_id - a.notification_id)
    .slice(0, MAX_ITEMS)
    .map(toNotification);

  return res.json(items);
});

module.exports = router;
