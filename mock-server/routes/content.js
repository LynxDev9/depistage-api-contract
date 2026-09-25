// routes/content.js
//
// Published educational content — contract v2.7.0.
//
// The three catalogue reads are public: no bearer token is validated on them.
// The two rating routes are protected, and `requireBearer` is applied per route
// rather than on the router, so a missing token can never break browsing.

const express = require('express');
const { db, VALID, error, requireBearer } = require('../db');

const router = express.Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// Resolves a seeded media value into the absolute public URL the contract
// requires. An absolute URL is returned verbatim; a relative path is made
// absolute from the host that was actually called — exactly like the real media
// gateway does at read time. Hardcoding a host would break the Android
// emulator, which reaches this server on 10.0.2.2.
function mediaUrl(req, value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get('host')}${value}`;
}

// Projects a stored row onto the contract's `ContentListItem`. Field names match
// the contract one-for-one; `status` is the only internal field and is dropped
// here rather than spread, so it can never reach the wire.
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
    asset_url: mediaUrl(req, row.asset_url),
    thumbnail_url: mediaUrl(req, row.thumbnail_url),
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
  if (row.status !== 'PUBLISHED') return false;
  // Contract v3.2.0: an EVENT needs both its Markdown and its cover image.
  // Missing either hides it from the list and 404s its detail.
  if (row.content_type === 'EVENT') {
    return Boolean(row.body_markdown?.trim()) && Boolean(row.thumbnail_url);
  }
  return true;
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

// Resolves a mobile-visible content row from a raw path parameter, or null.
//
// The caller answers the same 404 whether the id is malformed, unknown,
// archived or otherwise not mobile-visible — the API must never reveal that
// internal content exists.
function visibleContent(rawId) {
  const id = parsePositiveInt(rawId);
  if (id === null || id === undefined) return null;
  const row = db.content.items.find(r => r.content_id === id);
  if (!row || !isMobileVisible(row)) return null;
  return row;
}

function findRating(deviceUuid, contentId) {
  return db.content.ratings.find(
    r => r.device_uuid === deviceUuid && r.content_id === contentId,
  );
}

// GET /content/:content_id/rating — this device's current rating (protected).
//
// Declared before `/:content_id` for readability only; the two cannot collide,
// they differ in segment count. The one ordering that does matter is
// `/thematics` before `/:content_id`.
router.get('/:content_id/rating', requireBearer, (req, res) => {
  const row = visibleContent(req.params.content_id);
  if (!row) return error(res, 404, 'NOT_FOUND', 'Content not found.');

  const record = findRating(req.auth.device_uuid, row.content_id);
  // `rating: null` means visible-but-never-rated. Deliberately not a 404: that
  // status is reserved for content the device must not learn anything about.
  return res.json({
    content_id: row.content_id,
    rating: record ? record.rating : null,
  });
});

// PUT /content/:content_id/rating — set or replace this device's rating.
//
// The device comes from the JWT (`req.auth`), never from the body: the contract
// does not accept a device identifier here at all.
router.put('/:content_id/rating', requireBearer, (req, res) => {
  const row = visibleContent(req.params.content_id);
  if (!row) return error(res, 404, 'NOT_FOUND', 'Content not found.');

  const { rating } = req.body || {};
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return error(res, 422, 'VALIDATION_ERROR', 'rating must be between 1 and 5.');
  }

  const record = findRating(req.auth.device_uuid, row.content_id);
  if (record) {
    record.rating = rating;
  } else {
    db.content.ratings.push({
      device_uuid: req.auth.device_uuid,
      content_id: row.content_id,
      rating,
    });
  }

  return res.json({ content_id: row.content_id, rating });
});

// GET /content/:content_id — detail of one mobile-visible content item
router.get('/:content_id', (req, res) => {
  const row = visibleContent(req.params.content_id);
  if (!row) return error(res, 404, 'NOT_FOUND', 'Content not found.');

  return res.json(toDetail(req, row));
});

module.exports = router;
