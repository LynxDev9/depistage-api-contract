// db.js — Shared database and validation utilities

const db = {
  users: [],
  sessions: [],
  geo: {
    regions: [
      { RegionID: 1, Nom: 'Rabat-Salé-Kénitra', CodeISO: 'MA-04', Actif: true },
      { RegionID: 2, Nom: 'Casablanca-Settat', CodeISO: 'MA-06', Actif: true },
    ],
    provinces: [
      { ProvinceID: 10, RegionID: 1, Nom: 'Rabat', Code: 'RBA', Actif: true },
      { ProvinceID: 11, RegionID: 1, Nom: 'Salé', Code: 'SAL', Actif: true },
      { ProvinceID: 20, RegionID: 2, Nom: 'Casablanca', Code: 'CAS', Actif: true },
    ],
    categories: [
      { CategorieID: 3, Libelle: 'Centre de dépistage', Abreviation: 'CD', TypeMilieu: 'U', Actif: true },
      { CategorieID: 4, Libelle: 'Hôpital', Abreviation: 'HOP', TypeMilieu: 'H', Actif: true },
    ],
    centres: [
      {
        CentreID: 120,
        CodeGeo: 'CEN-0120',
        Nom: 'Centre Rabat - Exemple',
        RegionID: 1,
        ProvinceID: 10,
        CategorieID: 3,
        Reseau: 1,
        Latitude: 34.020882,
        Longitude: -6.841650,
        GeoLocation: null,
        DateMaj: new Date().toISOString(),
        Actif: true,
        Commune: 'Rabat',
      },
      {
        CentreID: 121,
        CodeGeo: 'CEN-0121',
        Nom: 'Centre Rabat Agdal - Exemple',
        RegionID: 1,
        ProvinceID: 10,
        CategorieID: 4,
        Reseau: 2,
        Latitude: 34.004900,
        Longitude: -6.853000,
        GeoLocation: null,
        DateMaj: new Date().toISOString(),
        Actif: true,
        Commune: 'Agdal-Ryad',
      },
      {
        CentreID: 122,
        CodeGeo: 'CEN-0122',
        Nom: 'Centre Salé - Exemple',
        RegionID: 1,
        ProvinceID: 11,
        CategorieID: 3,
        Reseau: 1,
        Latitude: 34.036300,
        Longitude: -6.798400,
        GeoLocation: null,
        DateMaj: new Date().toISOString(),
        Actif: true,
        Commune: 'Salé',
      },
    ],
    referrals: [],
  },
};

const VALID = {
  user_type:        ['YOUTH', 'KEY_POPULATION', 'MIGRANT', 'GENERAL_PUBLIC'],
  age_range:        ['LESS_18', '18_25', '26_35', '36_50', 'OVER_50'],
  gender:           ['MALE', 'FEMALE', 'PREFER_NOT_TO_SAY'],
  family_situation: ['MARRIED', 'SINGLE', 'PREFER_NOT_TO_SAY'],
  language:         ['FR', 'AR'],
  platform:         ['ANDROID', 'IOS'],
  center_referral_source: ['MAP', 'QUIZ', 'CHATBOT', 'NOTIFICATION'],
};

function validate(body, rules) {
  for (const [field, values] of Object.entries(rules)) {
    if (body[field] !== undefined && !values.includes(body[field])) {
      return `Invalid value '${body[field]}' for field '${field}'. Allowed: ${values.join(', ')}`;
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
  parseOptionalBoolean,
};
