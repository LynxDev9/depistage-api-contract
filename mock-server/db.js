// db.js — Shared database and validation utilities

const db = {
  users: [],
  sessions: [],
};

const VALID = {
  user_type:        ['YOUTH', 'KEY_POPULATION', 'MIGRANT', 'GENERAL_PUBLIC'],
  age_range:        ['LESS_18', '18_25', '26_35', '36_50', 'OVER_50'],
  gender:           ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'],
  family_situation: ['MARRIED', 'SINGLE', 'PREFER_NOT_TO_SAY'],
  language:         ['FR', 'AR'],
  platform:         ['ANDROID', 'IOS'],
};

function validate(body, rules) {
  for (const [field, values] of Object.entries(rules)) {
    if (body[field] !== undefined && !values.includes(body[field])) {
      return `Invalid value '${body[field]}' for field '${field}'. Allowed: ${values.join(', ')}`;
    }
  }
  return null;
}

function validateArray(value, allowedValues, fieldName) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return `Field '${fieldName}' must be an array`;
  if (value.length === 0) return `Field '${fieldName}' must contain at least one value`;
  for (const item of value) {
    if (!allowedValues.includes(item)) {
      return `Invalid value '${item}' in '${fieldName}'. Allowed: ${allowedValues.join(', ')}`;
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

module.exports = {
  db,
  VALID,
  validate,
  validateArray,
  requireFields,
  error,
};
