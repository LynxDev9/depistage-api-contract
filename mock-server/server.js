// mock-server/server.js

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 4010;

app.use(express.json());

// ---------------------------------------------------------------------------
// In-memory store — resets on server restart
// ---------------------------------------------------------------------------

const db = {
  users: [],
  sessions: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID = {
  user_type:  ['YOUTH', 'WOMAN', 'KEY_POPULATION', 'MIGRANT', 'GENERAL_PUBLIC'],
  age_range:  ['LESS_18', '18_25', '26_35', '36_50', 'OVER_50'],
  gender:     ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'],
  language:   ['FR', 'AR'],
  platform:   ['ANDROID', 'IOS'],
};

function validate(body, rules) {
  for (const [field, values] of Object.entries(rules)) {
    if (body[field] !== undefined && !values.includes(body[field])) {
      return `Invalid value '${body[field]}' for field '${field}'. Allowed: ${values.join(', ')}`;
    }
  }
  return null;
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (!body[field]) return `Missing required field: '${field}'`;
  }
  return null;
}

function error(res, status, code, message) {
  return res.status(status).json({ error: code, message });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// POST /users — register device
app.post('/users', (req, res) => {
  const body = req.body;

  const missing = requireFields(body, ['device_uuid', 'user_type', 'age_range', 'gender', 'language']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const invalid = validate(body, {
    user_type: VALID.user_type,
    age_range:  VALID.age_range,
    gender:     VALID.gender,
    language:   VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const exists = db.users.find(u => u.device_uuid === body.device_uuid);
  if (exists) return error(res, 409, 'CONFLICT', 'A user with this device_uuid already exists.');

  const user = {
    device_uuid: body.device_uuid,
    user_type:   body.user_type,
    age_range:   body.age_range,
    gender:      body.gender,
    language:    body.language,
    fcm_token:   body.fcm_token ?? null,
    created_at:  new Date().toISOString(),
  };

  db.users.push(user);
  console.log(`[POST /users] Created user: ${user.device_uuid}`);
  return res.status(201).json(user);
});

// GET /users/:device_uuid
app.get('/users/:device_uuid', (req, res) => {
  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');
  return res.json(user);
});

// PATCH /users/:device_uuid
app.patch('/users/:device_uuid', (req, res) => {
  const user = db.users.find(u => u.device_uuid === req.params.device_uuid);
  if (!user) return error(res, 404, 'NOT_FOUND', 'No user found for this device_uuid.');

  const invalid = validate(req.body, {
    user_type: VALID.user_type,
    age_range:  VALID.age_range,
    gender:     VALID.gender,
    language:   VALID.language,
  });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const allowed = ['user_type', 'age_range', 'gender', 'language', 'fcm_token'];
  allowed.forEach(field => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  console.log(`[PATCH /users] Updated user: ${user.device_uuid}`);
  return res.json(user);
});

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

// POST /sessions — start session
app.post('/sessions', (req, res) => {
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
app.patch('/sessions/:id', (req, res) => {
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) return error(res, 404, 'NOT_FOUND', 'No session found for this id.');

  if (req.body.duration_sec === undefined) {
    return error(res, 422, 'VALIDATION_ERROR', "Missing required field: 'duration_sec'");
  }

  session.duration_sec = req.body.duration_sec;
  console.log(`[PATCH /sessions] Ended session: ${session.id} — ${session.duration_sec}s`);
  return res.json(session);
});

// ---------------------------------------------------------------------------
// Debug route — see current db state
// ---------------------------------------------------------------------------

app.get('/_db', (req, res) => res.json(db));

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log(`Debug DB: http://localhost:${PORT}/_db`);
});