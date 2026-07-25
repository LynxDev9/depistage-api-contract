// routes/sessions.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, VALID, validate, requireFields, error, issueToken, requireBearer } = require('../db');

const router = express.Router();

// Projects a stored session onto the contract's `SessionResponse` shape.
// Internal bookkeeping (is_active, and later last_heartbeat_at) stays server-side
// and must never reach the wire — the schema does not define those fields.
function sessionResponse(session, token) {
  return {
    id:           session.id,
    device_uuid:  session.device_uuid,
    started_at:   session.started_at,
    duration_sec: session.duration_sec,
    platform:     session.platform,
    app_version:  session.app_version,
    ...token,
  };
}

// POST /sessions — start session
router.post('/', (req, res) => {
  const body = req.body;

  const missing = requireFields(body, ['device_uuid', 'platform', 'app_version']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const invalid = validate(body, { platform: VALID.platform });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const userExists = db.users.find(u => u.device_uuid === body.device_uuid);
  if (!userExists) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');

  const session = {
    id:           uuidv4(),
    device_uuid:  body.device_uuid,
    started_at:   new Date().toISOString(),
    // Contract v2.4.0: a creation response returns zero, never null. The client
    // must not treat `null` as the "brand new session" marker.
    duration_sec: 0,
    platform:     body.platform,
    app_version:  body.app_version,
    // Internal only. A terminal session keeps existing (so it is not a 404) but
    // permanently refuses heartbeats with 409 SESSION_INACTIVE.
    is_active:    true,
  };

  db.sessions.push(session);

  // Issue the short-lived anonymous mobile JWT for protected write endpoints.
  const token = issueToken(session);
  console.log(`[POST /sessions] Started session: ${session.id}`);
  return res.status(201).json(sessionResponse(session, token));
});

// PATCH /sessions/:id — end session
// Protected: MobileAnonymousBearer (contract v2.3.0) — path id must match JWT session_id claim.
router.patch('/:id', requireBearer, (req, res) => {
  if (req.auth.session_id !== req.params.id) {
    return error(res, 403, 'FORBIDDEN', 'The access token does not have permission to access this resource.');
  }

  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return error(res, 404, 'NOT_FOUND', 'No session found for this id.');

  // The session exists but is terminal: the client must abandon it and start a
  // new one rather than retry this heartbeat.
  if (!session.is_active) {
    return error(res, 409, 'SESSION_INACTIVE', 'This session is no longer active.');
  }

  const duration = req.body.duration_sec;
  if (duration === undefined) {
    return error(res, 422, 'VALIDATION_ERROR', "Missing required field: 'duration_sec'");
  }
  if (!Number.isInteger(duration) || duration < 0) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for field 'duration_sec'.");
  }

  // Monotonic total: a delayed or duplicate heartbeat carries a stale (lower)
  // total. The contract requires such a request not to reduce the stored value,
  // so clamp instead of rejecting — network reordering is not a client error.
  const isStale = duration < session.duration_sec;
  session.duration_sec = Math.max(session.duration_sec, duration);

  // Contract re-issues a fresh token on this response (SessionResponse requires it).
  const token = issueToken(session);
  const staleNote = isStale ? ` (ignored stale ${duration}s)` : '';
  console.log(`[PATCH /sessions] Ended session: ${session.id} — ${session.duration_sec}s${staleNote}`);
  return res.json(sessionResponse(session, token));
});

module.exports = router;
