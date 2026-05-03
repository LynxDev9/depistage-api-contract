// routes/sessions.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, VALID, validate, requireFields, error } = require('../db');

const router = express.Router();

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
    duration_sec: null,
    platform:     body.platform,
    app_version:  body.app_version,
  };

  db.sessions.push(session);
  console.log(`[POST /sessions] Started session: ${session.id}`);
  return res.status(201).json(session);
});

// PATCH /sessions/:id — end session
router.patch('/:id', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return error(res, 404, 'NOT_FOUND', 'No session found for this id.');

  if (req.body.duration_sec === undefined) {
    return error(res, 422, 'VALIDATION_ERROR', "Missing required field: 'duration_sec'");
  }

  session.duration_sec = req.body.duration_sec;
  console.log(`[PATCH /sessions] Ended session: ${session.id} — ${session.duration_sec}s`);
  return res.json(session);
});

module.exports = router;
