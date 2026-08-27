// routes/content.js
//
// Published educational content — contract v2.5.1. All three reads are public:
// no bearer token is validated here.

const express = require('express');
const { db, VALID, error } = require('../db');

const router = express.Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Builds the absolute public media URL from the host that was actually called,
// exactly like the real media gateway does at read time. Hardcoding a host
// would break the Android emulator, which reaches this server on 10.0.2.2.
function mediaUrl(req, path) {
  if (!path) return null;
  return `${req.protocol}://${req.get('host')}${path}`;
}

// Projects an internal row onto the wire shape. `status`, `asset_path`,
// `thumbnail_path` and `asset_external_url` are internal and never exposed.
function toListItem(req, row) {
  return {
    content_id: row.content_id,
    thematic_id: row.thematic_id,
    thematic_name: row.thematic_name,
    title: row.title,
    summary: row.summary,
    content_type: row.content_type,
    language: row.language,
    is_highlighted: row.is_highlighted,
    asset_url: row.asset_external_url || mediaUrl(req, row.asset_path),
    thumbnail_url: mediaUrl(req, row.thumbnail_path),
    duration_seconds: row.duration_seconds,
    published_at: row.published_at,
  };
}

function toDetail(req, row) {
  return {
    ...toListItem(req, row),
    body_markdown: row.body_markdown,
    source_name: row.source_name,
    source_reference: row.source_reference,
  };
}

function isMobileVisible(row) {
  return row.status === 'PUBLISHED';
}

// Parses an optional positive-integer query parameter.
// Returns undefined when absent, or null when present but invalid.
function parsePositiveInt(value) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

function parseOptionalBool(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

// GET /content/thematics
// ⚠️ Must stay declared BEFORE `/:content_id`, otherwise Express would match
// "thematics" as a content id.
router.get('/thematics', (req, res) => {
  const active = db.content.thematics.filter(t => t.is_active);
  const ordered = [...active].sort((a, b) => a.sort_order - b.sort_order);
  return res.json(ordered);
});

// GET /content — paginated list of mobile-visible content
router.get('/', (req, res) => {
  const { language, thematic_id, content_type, is_highlighted } = req.query;

  if (language !== undefined && !VALID.language.includes(language)) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for field 'language'.");
  }
  if (content_type !== undefined && !VALID.content_type.includes(content_type)) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for field 'content_type'.");
  }

  const thematicId = parsePositiveInt(thematic_id);
  if (thematicId === null) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for field 'thematic_id'.");
  }

  const highlighted = parseOptionalBool(is_highlighted);
  if (highlighted === null) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for field 'is_highlighted'.");
  }

  const page = parsePositiveInt(req.query.page);
  if (page === null) {
    return error(res, 422, 'VALIDATION_ERROR', 'Invalid pagination value.');
  }
  const pageSize = parsePositiveInt(req.query.page_size);
  if (pageSize === null || (pageSize !== undefined && pageSize > MAX_PAGE_SIZE)) {
    return error(res, 422, 'VALIDATION_ERROR', 'Invalid pagination value.');
  }

  const currentPage = page ?? 1;
  const currentPageSize = pageSize ?? DEFAULT_PAGE_SIZE;

  let rows = db.content.items.filter(isMobileVisible);
  if (language !== undefined) rows = rows.filter(r => r.language === language);
  if (thematicId !== undefined) rows = rows.filter(r => r.thematic_id === thematicId);
  if (content_type !== undefined) rows = rows.filter(r => r.content_type === content_type);
  if (highlighted !== undefined) rows = rows.filter(r => r.is_highlighted === highlighted);

  // Deterministic order required by the contract: highlighted first, then most
  // recently published, then content_id ascending as the stable tie-breaker.
  rows = [...rows].sort((a, b) => {
    if (a.is_highlighted !== b.is_highlighted) return a.is_highlighted ? -1 : 1;
    const dateDiff = new Date(b.published_at) - new Date(a.published_at);
    if (dateDiff !== 0) return dateDiff;
    return a.content_id - b.content_id;
  });

  const totalCount = rows.length;
  const start = (currentPage - 1) * currentPageSize;
  const items = rows.slice(start, start + currentPageSize);

  return res.json({
    items: items.map(r => toListItem(req, r)),
    page: currentPage,
    page_size: currentPageSize,
    total_count: totalCount,
  });
});

// GET /content/:content_id — detail of one mobile-visible content item
router.get('/:content_id', (req, res) => {
  const id = parsePositiveInt(req.params.content_id);
  if (id === null || id === undefined) {
    return error(res, 404, 'NOT_FOUND', 'Content not found.');
  }

  const row = db.content.items.find(r => r.content_id === id);
  // Same 404 whether it is missing, archived or otherwise not mobile-visible —
  // the API must not reveal that internal content exists.
  if (!row || !isMobileVisible(row)) {
    return error(res, 404, 'NOT_FOUND', 'Content not found.');
  }

  return res.json(toDetail(req, row));
});

module.exports = router;
