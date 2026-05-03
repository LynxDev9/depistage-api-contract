// routes/users.js

const express = require('express');
const { db, VALID, validate, requireFields, error } = require('../db');

const router = express.Router();

// POST /users — register device
router.post('/', (req, res) => {
  const body = req.body;

  const missing = requireFields(body, ['device_uuid', 'user_type', 'age_range', 'gender', 'family_situation', 'language']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const invalid = validate(body, {
    user_type:        VALID.user_type,
    age_range:        VALID.age_range,
    gender:           VALID.gender,
    family_situation: VALID.family_situation,
    language:         VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const exists = db.users.find(u => u.device_uuid === body.device_uuid);
  if (exists) return error(res, 409, 'CONFLICT', 'A user with this device_uuid already exists.');

  const user = {
    device_uuid:      body.device_uuid,
    user_type:        body.user_type,
    age_range:        body.age_range,
    gender:           body.gender,
    family_situation: body.family_situation,
    language:         body.language,
    fcm_token:        body.fcm_token ?? null,
    created_at:       new Date().toISOString(),
  };

  db.users.push(user);
  console.log(`[POST /users] Created user: ${user.device_uuid}`);
  return res.status(201).json(user);
});

// GET /users/:device_uuid
router.get('/:device_uuid', (req, res) => {
  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');
  return res.json(user);
});

// PATCH /users/:device_uuid
router.patch('/:device_uuid', (req, res) => {
  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');

  const invalid = validate(req.body, {
    user_type:        VALID.user_type,
    age_range:        VALID.age_range,
    gender:           VALID.gender,
    family_situation: VALID.family_situation,
    language:         VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const allowed = ['user_type', 'age_range', 'gender', 'family_situation', 'language', 'fcm_token'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  console.log(`[PATCH /users] Updated user: ${user.device_uuid}`);
  return res.json(user);
});

module.exports = router;
