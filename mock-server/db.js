// db.js — Shared database and validation utilities

const db = {
  users: [],
  sessions: [],
  // access_token -> { device_uuid, session_id, expires_at (epoch ms) }
  tokens: {},
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

  // ── Content (cms schema, contract v2.5.1) ────────────────────────────────
  //
  // Rows carry internal fields the wire format never exposes:
  //   status      'PUBLISHED' | 'ARCHIVED'  — only PUBLISHED is mobile-visible
  //   asset_path  relative media path, turned into an absolute URL at read time
  //               from the requesting host (mirrors the real media gateway, and
  //               keeps URLs reachable from the Android emulator's 10.0.2.2)
  //   asset_external_url  used verbatim instead of asset_path (public HLS demo)
  content: {
    thematics: [
      { thematic_id: 1, name: 'VIH', disease: 'HIV', sort_order: 10, is_active: true },
      { thematic_id: 2, name: 'Hépatites', disease: 'HEPATITIS', sort_order: 20, is_active: true },
      { thematic_id: 3, name: 'Syphilis', disease: 'SYPHILIS', sort_order: 30, is_active: true },
      { thematic_id: 4, name: 'Général', disease: 'ALL', sort_order: 40, is_active: true },
    ],

    items: [
      {
        content_id: 1,
        thematic_id: 1,
        thematic_name: 'VIH',
        title: 'Comprendre le dépistage du VIH',
        summary: 'Pourquoi, quand et où se faire dépister.',
        content_type: 'VIDEO',
        language: 'fr',
        is_highlighted: true,
        body_markdown: null,
        // Apple's public HLS example: a master playlist with relative variant
        // paths, same shape as the backend's own output.
        asset_external_url:
          'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
        asset_path: null,
        thumbnail_path: '/media/content/1/thumbnail/poster.jpg',
        duration_seconds: 173,
        source_name: 'MSPS',
        source_reference: 'Programme national de dépistage',
        published_at: '2026-08-20T09:00:00Z',
        status: 'PUBLISHED',
      },
      {
        content_id: 2,
        thematic_id: 1,
        thematic_name: 'VIH',
        title: 'Le VIH en 5 questions',
        summary: 'Les réponses aux idées reçues les plus fréquentes.',
        content_type: 'TEXT',
        language: 'fr',
        is_highlighted: false,
        body_markdown:
          '# Le VIH en 5 questions\n\n' +
          "Le VIH est un virus qui s'attaque au système immunitaire.\n\n" +
          '## 1. Comment se transmet-il ?\n\n' +
          'Principalement par voie **sexuelle**, sanguine, ou de la mère à l\'enfant.\n\n' +
          '## 2. Peut-on en guérir ?\n\n' +
          "Il n'existe pas de guérison, mais les traitements permettent de vivre normalement.\n\n" +
          '- Un traitement précoce est plus efficace\n' +
          '- Une charge virale indétectable rend le virus intransmissible\n\n' +
          '> Se faire dépister est la seule façon de connaître son statut.\n',
        asset_external_url: null,
        asset_path: null,
        thumbnail_path: null,
        duration_seconds: null,
        source_name: 'MSPS',
        source_reference: 'Fiche d\'information officielle',
        published_at: '2026-08-18T14:30:00Z',
        status: 'PUBLISHED',
      },
      {
        content_id: 3,
        thematic_id: 2,
        thematic_name: 'Hépatites',
        title: 'Prévenir les hépatites virales',
        summary: 'Gestes de prévention et situations où demander conseil.',
        content_type: 'INFOGRAPHIC',
        language: 'fr',
        is_highlighted: true,
        body_markdown: null,
        asset_external_url: null,
        asset_path: '/media/content/3/infographic/prevention.png',
        thumbnail_path: '/media/content/3/thumbnail/poster.jpg',
        duration_seconds: null,
        source_name: 'MSPS',
        source_reference: 'Support de sensibilisation aux hépatites',
        published_at: '2026-08-15T10:00:00Z',
        status: 'PUBLISHED',
      },
      {
        content_id: 4,
        thematic_id: 3,
        thematic_name: 'Syphilis',
        title: 'التعرف على مرض الزهري',
        summary: 'الأعراض وطرق الوقاية.',
        content_type: 'AUDIO',
        language: 'ar',
        is_highlighted: false,
        body_markdown: null,
        asset_external_url: null,
        asset_path: '/media/content/4/audio/syphilis.mp3',
        thumbnail_path: null,
        duration_seconds: 245,
        source_name: 'MSPS',
        source_reference: 'حملة التوعية الوطنية',
        published_at: '2026-08-10T08:00:00Z',
        status: 'PUBLISHED',
      },
      {
        content_id: 5,
        thematic_id: 4,
        thematic_name: 'Général',
        title: 'أين يمكنني إجراء الفحص؟',
        summary: 'دليل مراكز الفحص المجاني.',
        content_type: 'TEXT',
        language: 'ar',
        is_highlighted: false,
        body_markdown:
          '# أين يمكنني إجراء الفحص؟\n\n'
          + 'الفحص **مجاني** في جميع المراكز الصحية العمومية.\n\n'
          + '- لا حاجة إلى موعد مسبق\n'
          + '- النتائج سرية تماما\n',
        asset_external_url: null,
        asset_path: null,
        thumbnail_path: null,
        duration_seconds: null,
        source_name: 'MSPS',
        source_reference: 'دليل المستعمل',
        published_at: '2026-08-05T12:00:00Z',
        status: 'PUBLISHED',
      },
      {
        content_id: 6,
        thematic_id: 2,
        thematic_name: 'Hépatites',
        title: 'Ancienne campagne hépatite B',
        summary: 'Contenu retiré du catalogue mobile.',
        content_type: 'VIDEO',
        language: 'fr',
        is_highlighted: false,
        body_markdown: null,
        asset_external_url: null,
        asset_path: '/media/content/6/hls/master.m3u8',
        thumbnail_path: null,
        duration_seconds: 90,
        source_name: 'MSPS',
        source_reference: 'Campagne 2024',
        published_at: '2026-07-01T09:00:00Z',
        // Must never appear in GET /content, and its detail must return 404.
        status: 'ARCHIVED',
      },
    ],
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
  // ⚠️ UPPERCASE CMS codes, unlike every other enum in this API.
  content_type: ['TEXT', 'INFOGRAPHIC', 'VIDEO', 'AUDIO'],
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

// ---------------------------------------------------------------------------
// Anonymous mobile JWT (contract v2.1.0 — MobileAnonymousBearer)
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_TTL_SEC = 900; // 15 min, matches contract `expires_in`

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Mints a fake-but-well-formed JWT for an anonymous device/session and records
// it so protected endpoints can validate it. Not cryptographically signed —
// this is a mock.
function issueToken(session) {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: session.device_uuid,
    session_id: session.id,
    role: 'anonymous',
    iat: nowSec,
    exp: nowSec + ACCESS_TOKEN_TTL_SEC,
  };
  const signature = base64url({ mock: true });
  const access_token = `${base64url(header)}.${base64url(payload)}.${signature}`;

  // Purge any previous token for the SAME session before inserting the new one,
  // so db.tokens holds at most one live token per session. Without this, every
  // heartbeat PATCH /sessions/{id} leaks a fresh (still-valid) token row.
  for (const [tok, rec] of Object.entries(db.tokens)) {
    if (rec.session_id === session.id) delete db.tokens[tok];
  }

  db.tokens[access_token] = {
    device_uuid: session.device_uuid,
    session_id: session.id,
    expires_at: (nowSec + ACCESS_TOKEN_TTL_SEC) * 1000,
  };

  return {
    access_token,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SEC,
  };
}

// Express middleware enforcing `Authorization: Bearer <access_token>`.
// Emits the contract `Unauthorized` (401) response shape on any failure.
function requireBearer(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const unauthorized = () =>
    error(res, 401, 'UNAUTHORIZED', 'Missing, invalid, or expired access token.');

  if (!match) return unauthorized();

  const token = match[1].trim();
  const record = db.tokens[token];
  if (!record) return unauthorized();
  if (record.expires_at <= Date.now()) {
    delete db.tokens[token];
    return unauthorized();
  }

  req.auth = record; // { device_uuid, session_id, expires_at }
  return next();
}

module.exports = {
  db,
  VALID,
  validate,
  validateArray,
  requireFields,
  error,
  parseOptionalBoolean,
  ACCESS_TOKEN_TTL_SEC,
  issueToken,
  requireBearer,
};
