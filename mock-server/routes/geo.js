// routes/geo.js
//
// CMS referentials: read-only (GET)
// App tables: CRUD (referrals)

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, VALID, validate, requireFields, error, parseOptionalBoolean } = require('../db');

const router = express.Router();

// ---------------------------------------------------------------------------
// CMS referentials (read-only)
// ---------------------------------------------------------------------------

router.get('/regions', (req, res) => {
  return res.json(db.geo.regions);
});

router.get('/regions/:region_id', (req, res) => {
  const id = Number(req.params.region_id);
  const region = db.geo.regions.find(r => r.region_id === id);
  if (!region) return error(res, 404, 'NOT_FOUND', 'Region not found.');
  return res.json(region);
});

router.get('/provinces', (req, res) => {
  const regionId = req.query.region_id !== undefined ? Number(req.query.region_id) : undefined;
  let out = db.geo.provinces;
  if (regionId !== undefined && !Number.isNaN(regionId)) {
    out = out.filter(p => p.region_id === regionId);
  }
  return res.json(out);
});

router.get('/provinces/:province_id', (req, res) => {
  const id = Number(req.params.province_id);
  const province = db.geo.provinces.find(p => p.province_id === id);
  if (!province) return error(res, 404, 'NOT_FOUND', 'Province not found.');
  return res.json(province);
});

router.get('/communes', (req, res) => {
  const regionId = req.query.region_id !== undefined ? Number(req.query.region_id) : undefined;
  const provinceId = req.query.province_id !== undefined ? Number(req.query.province_id) : undefined;
  const active = parseOptionalBoolean(req.query.active);
  if (active === null) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for query param 'active' (expected true/false)");
  }

  let out = db.geo.communes;
  if (regionId !== undefined && !Number.isNaN(regionId)) out = out.filter(c => c.region_id === regionId);
  if (provinceId !== undefined && !Number.isNaN(provinceId)) out = out.filter(c => c.province_id === provinceId);
  if (active !== undefined) out = out.filter(c => c.is_active === active);
  return res.json(out);
});

router.get('/communes/:commune_id', (req, res) => {
  const id = Number(req.params.commune_id);
  const commune = db.geo.communes.find(c => c.commune_id === id);
  if (!commune) return error(res, 404, 'NOT_FOUND', 'Commune not found.');
  return res.json(commune);
});

router.get('/categories', (req, res) => {
  const active = parseOptionalBoolean(req.query.active);
  if (active === null) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for query param 'active' (expected true/false)");
  }
  let out = db.geo.categories;
  if (active !== undefined) out = out.filter(c => c.is_active === active);
  return res.json(out);
});

router.get('/categories/:category_id', (req, res) => {
  const id = Number(req.params.category_id);
  const category = db.geo.categories.find(c => c.category_id === id);
  if (!category) return error(res, 404, 'NOT_FOUND', 'Category not found.');
  return res.json(category);
});

router.get('/centers', (req, res) => {
  const regionId = req.query.region_id !== undefined ? Number(req.query.region_id) : undefined;
  const provinceId = req.query.province_id !== undefined ? Number(req.query.province_id) : undefined;
  const categoryId = req.query.category_id !== undefined ? Number(req.query.category_id) : undefined;
  const communeId = req.query.commune_id !== undefined ? Number(req.query.commune_id) : undefined;
  const active = parseOptionalBoolean(req.query.active);
  if (active === null) {
    return error(res, 422, 'VALIDATION_ERROR', "Invalid value for query param 'active' (expected true/false)");
  }

  let out = db.geo.centers;
  if (regionId !== undefined && !Number.isNaN(regionId)) out = out.filter(c => c.region_id === regionId);
  if (provinceId !== undefined && !Number.isNaN(provinceId)) out = out.filter(c => c.province_id === provinceId);
  if (categoryId !== undefined && !Number.isNaN(categoryId)) out = out.filter(c => c.category_id === categoryId);
  if (communeId !== undefined && !Number.isNaN(communeId)) out = out.filter(c => c.commune_id === communeId);
  if (active !== undefined) out = out.filter(c => c.is_active === active);
  return res.json(out);
});

router.get('/centers/:center_id', (req, res) => {
  const id = Number(req.params.center_id);
  const center = db.geo.centers.find(c => c.center_id === id);
  if (!center) return error(res, 404, 'NOT_FOUND', 'Center not found.');
  return res.json(center);
});

// ---------------------------------------------------------------------------
// App table: CenterReferral (CRUD)
// ---------------------------------------------------------------------------

router.get('/referrals', (req, res) => {
  const deviceUuid = req.query.device_uuid;
  const out = deviceUuid ? db.geo.referrals.filter(r => r.device_uuid === deviceUuid) : db.geo.referrals;
  return res.json(out);
});

router.post('/referrals', (req, res) => {
  const body = req.body || {};

  const missing = requireFields(body, ['device_uuid', 'center_id', 'source']);
  if (missing) return error(res, 422, 'VALIDATION_ERROR', missing);

  const invalid = validate(body, { source: VALID.center_referral_source });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const referral = {
    id: uuidv4(),
    device_uuid: body.device_uuid,
    center_id: body.center_id,
    quiz_result_id: body.quiz_result_id ?? null,
    source: body.source,
    followed_up: body.followed_up ?? false,
  };

  db.geo.referrals.push(referral);
  return res.status(201).json(referral);
});

router.get('/referrals/:id', (req, res) => {
  const referral = db.geo.referrals.find(r => r.id === req.params.id);
  if (!referral) return error(res, 404, 'NOT_FOUND', 'Referral not found');
  return res.json(referral);
});

router.patch('/referrals/:id', (req, res) => {
  const referral = db.geo.referrals.find(r => r.id === req.params.id);
  if (!referral) return error(res, 404, 'NOT_FOUND', 'Referral not found');

  const invalid = validate(req.body || {}, { source: VALID.center_referral_source });
  if (invalid) return error(res, 422, 'VALIDATION_ERROR', invalid);

  const allowed = ['quiz_result_id', 'source', 'followed_up'];
  for (const field of allowed) {
    if (req.body[field] !== undefined) referral[field] = req.body[field];
  }

  return res.json(referral);
});

router.delete('/referrals/:id', (req, res) => {
  const idx = db.geo.referrals.findIndex(r => r.id === req.params.id);
  if (idx === -1) return error(res, 404, 'NOT_FOUND', 'Referral not found');
  db.geo.referrals.splice(idx, 1);
  return res.status(204).send();
});

module.exports = router;
