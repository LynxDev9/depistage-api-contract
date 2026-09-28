// routes/users.js

const express = require('express');
const { db, VALID, validate, requireFields, error, requireBearer } = require('../db');

const router = express.Router();

// Contract v3.3.0 / v3.4.0: `user_type` and `family_situation` belong to the
// server, which derives them from a completed auto-evaluation. A client that
// sends either is refused instead of silently ignored.
//
// Stricter than the contract on purpose: the real server may simply drop the
// fields, but a 422 here makes any regression in the app fail loudly.
function serverOwnedFieldError(body) {
  for (const field of ['user_type', 'family_situation']) {
    if (body[field] !== undefined) {
      return `Field '${field}' is server-owned and must not be sent.`;
    }
  }
  return null;
}

// POST /users — register device
router.post('/', (req, res) => {
  const body = req.body;

  const missing = requireFields(body, ['device_uuid', 'age_range', 'gender', 'language']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const serverOwned = serverOwnedFieldError(body);
  if (serverOwned) return error(res, 422, 'VALIDATION_ERROR', serverOwned);

  const invalid = validate(body, {
    age_range: VALID.age_range,
    gender: VALID.gender,
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
    // Empty until a completed auto-evaluation assigns a classification.
    user_type: [],
    age_range: body.age_range,
    gender: body.gender,
    family_situation: null,
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
// Protected: MobileAnonymousBearer (contract v2.3.0) — path device_uuid must match JWT claim.
router.get('/:device_uuid', requireBearer, (req, res) => {
  if (req.auth.device_uuid !== req.params.device_uuid) {
    return error(res, 403, 'FORBIDDEN', 'The access token does not have permission to access this resource.');
  }

  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');
  return res.json(user);
});

// PATCH /users/:device_uuid
// Protected: MobileAnonymousBearer (contract v2.3.0) — path device_uuid must match JWT claim.
router.patch('/:device_uuid', requireBearer, (req, res) => {
  if (req.auth.device_uuid !== req.params.device_uuid) {
    return error(res, 403, 'FORBIDDEN', 'The access token does not have permission to access this resource.');
  }

  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');

  const serverOwned = serverOwnedFieldError(req.body);
  if (serverOwned) return error(res, 422, 'VALIDATION_ERROR', serverOwned);

  const invalid = validate(req.body, {
    age_range: VALID.age_range,
    gender: VALID.gender,
    language: VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const nextGender = req.body.gender !== undefined ? req.body.gender : user.gender;
  const nextIsPregnant = req.body.is_pregnant !== undefined ? req.body.is_pregnant : user.is_pregnant;
  if (nextIsPregnant !== undefined && nextIsPregnant !== null && nextGender !== 'female') {
    return error(res, 422, 'VALIDATION_ERROR', "Field 'is_pregnant' must be null unless gender is 'female'.");
  }

  const allowed = ['age_range', 'gender', 'language', 'is_pregnant', 'fcm_token'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  console.log(`[PATCH /users] Updated user: ${user.device_uuid}`);
  return res.json(user);
});

module.exports = router;
