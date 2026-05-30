// routes/users.js

const express = require('express');
const { db, VALID, validate, validateArray, requireFields, error } = require('../db');

const router = express.Router();

// POST /users — register device
router.post('/', (req, res) => {
  const body = req.body;

  const missing = requireFields(body, ['device_uuid', 'user_type', 'age_range', 'gender', 'language']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const invalidUserType = validateArray(body.user_type, VALID.user_type, 'user_type');
  if (invalidUserType) return error(res, 422, 'VALIDATION_ERROR', invalidUserType);

  const invalid = validate(body, {
    age_range: VALID.age_range,
    gender: VALID.gender,
    family_situation: VALID.family_situation,
    language: VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const exists = db.users.find(u => u.device_uuid === body.device_uuid);
  if (exists) return error(res, 409, 'CONFLICT', 'A user with this device_uuid already exists.');

  if (body.is_pregnant !== undefined && body.is_pregnant !== null && body.gender !== 'female') {
    return error(res, 422, 'VALIDATION_ERROR', "Field 'is_pregnant' must be null unless gender is 'female'.");
  }

  const user = {
    device_uuid: body.device_uuid,
    user_type: body.user_type,
    age_range: body.age_range,
    gender: body.gender,
    family_situation: body.family_situation ?? null,
    language: body.language,
    is_pregnant: body.is_pregnant ?? null,
    fcm_token: body.fcm_token ?? null,
    created_at: new Date().toISOString(),
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

  if (req.body.user_type !== undefined) {
    const invalidUserType = validateArray(req.body.user_type, VALID.user_type, 'user_type');
    if (invalidUserType) return error(res, 422, 'VALIDATION_ERROR', invalidUserType);
  }

  const invalid = validate(req.body, {
    age_range: VALID.age_range,
    gender: VALID.gender,
    family_situation: VALID.family_situation,
    language: VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const nextGender = req.body.gender !== undefined ? req.body.gender : user.gender;
  const nextIsPregnant = req.body.is_pregnant !== undefined ? req.body.is_pregnant : user.is_pregnant;
  if (nextIsPregnant !== undefined && nextIsPregnant !== null && nextGender !== 'female') {
    return error(res, 422, 'VALIDATION_ERROR', "Field 'is_pregnant' must be null unless gender is 'female'.");
  }

  const allowed = ['user_type', 'age_range', 'gender', 'family_situation', 'language', 'is_pregnant', 'fcm_token'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  console.log(`[PATCH /users] Updated user: ${user.device_uuid}`);
  return res.json(user);
});

module.exports = router;
