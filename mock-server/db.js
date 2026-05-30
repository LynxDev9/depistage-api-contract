// db.js — Shared database and validation utilities

const db = {
  users: [],
  sessions: [],
  geo: {
    regions: [
      { region_id: 1, name: 'Rabat-Salé-Kénitra', region_code: 'MA-04', is_active: true },
      { region_id: 2, name: 'Casablanca-Settat', region_code: 'MA-06', is_active: true },
    ],
    provinces: [
      { province_id: 10, region_id: 1, name: 'Rabat', province_code: 'RBA', is_active: true },
      { province_id: 11, region_id: 1, name: 'Salé', province_code: 'SAL', is_active: true },
      { province_id: 20, region_id: 2, name: 'Casablanca', province_code: 'CAS', is_active: true },
    ],
    communes: [
      { commune_id: 101, region_id: 1, province_id: 10, name: 'Rabat', commune_code: 'RBA-01', is_active: true },
      { commune_id: 102, region_id: 1, province_id: 11, name: 'Salé', commune_code: 'SAL-01', is_active: true },
      { commune_id: 103, region_id: 2, province_id: 20, name: 'Casablanca', commune_code: 'CAS-01', is_active: true },
    ],
    categories: [
      { category_id: 3, label: 'Centre de dépistage', abbreviation: 'CD', environment_type: 'u', is_active: true },
      { category_id: 4, label: 'Hôpital', abbreviation: 'HOP', environment_type: 'h', is_active: true },
    ],
    centers: [
      {
        center_id: 120,
        geo_code: 'CEN-0120',
        name: 'Centre Rabat - Exemple',
        region_id: 1,
        province_id: 10,
        category_id: 3,
        commune_id: 101,
        network: 1,
        latitude: 34.020882,
        longitude: -6.841650,
        updated_at: new Date().toISOString(),
        is_active: true,
        commune_name: 'Rabat',
      },
      {
        center_id: 121,
        geo_code: 'CEN-0121',
        name: 'Centre Rabat Agdal - Exemple',
        region_id: 1,
        province_id: 10,
        category_id: 4,
        commune_id: 101,
        network: 2,
        latitude: 34.004900,
        longitude: -6.853000,
        updated_at: new Date().toISOString(),
        is_active: true,
        commune_name: 'Agdal-Ryad',
      },
      {
        center_id: 122,
        geo_code: 'CEN-0122',
        name: 'Centre Salé - Exemple',
        region_id: 1,
        province_id: 11,
        category_id: 3,
        commune_id: 102,
        network: 1,
        latitude: 34.036300,
        longitude: -6.798400,
        updated_at: new Date().toISOString(),
        is_active: true,
        commune_name: 'Salé',
      },
    ],
    referrals: [],
  },
};

const VALID = {
  user_type: ['youth', 'key_population', 'migrant', 'general_public'],
  age_range: ['less_18', '18_25', '26_35', '36_50', 'over_50'],
  gender: ['male', 'female', 'prefer_not_to_say'],
  family_situation: ['married', 'single', 'prefer_not_to_say'],
  language: ['fr', 'ar'],
  platform: ['android', 'ios'],
  center_referral_source: ['map', 'quiz', 'chatbot', 'notification'],
  environment_type: ['r', 'u', 's', 'h'],
};

function validate(body, rules) {
  for (const [field, values] of Object.entries(rules)) {
    if (body[field] !== undefined && !values.includes(body[field])) {
      return `Invalid value for field '${field}'.`;
    }
  }
  return null;
}

function parseOptionalBoolean(value) {
  if (value === undefined) return undefined;
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}

function validateArray(value, allowedValues, fieldName) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return `Field '${fieldName}' must be an array`;
  if (value.length === 0) return `Field '${fieldName}' must contain at least one value`;
  for (const item of value) {
    if (!allowedValues.includes(item)) {
      return `Invalid value for field '${fieldName}'.`;
    }
  }
  return null;
}

function requireFields(body, fields) {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `Missing required field: '${field}'`;
    }
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
  parseOptionalBoolean,
};
