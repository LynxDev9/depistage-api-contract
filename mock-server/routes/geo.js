// routes/geo.js
//
// CMS referentials: read-only (GET).
//
// /geo/referrals was removed in contract v3.11.0: a referral is now a tap on
// « Appeler » or « Ouvrir dans Maps », reported through POST /events.

const express = require('express');
const { db, VALID, error, parseOptionalBoolean } = require('../db');

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

  // operator_type (v3.0.0): exact filter, MSPS or ONG. Empty, repeated
  // (Express turns a repeated query key into an array) or unsupported values
  // all fail the same 422 — none of them is a value this filter accepts.
  const operatorType = req.query.operator_type;
  if (
    operatorType !== undefined &&
    (typeof operatorType !== 'string' || !VALID.operator_type.includes(operatorType))
  ) {
    return error(res, 422, 'VALIDATION_ERROR', 'operator_type must be MSPS or ONG.');
  }

  let out = db.geo.centers;
  if (regionId !== undefined && !Number.isNaN(regionId)) out = out.filter(c => c.region_id === regionId);
  if (provinceId !== undefined && !Number.isNaN(provinceId)) out = out.filter(c => c.province_id === provinceId);
  if (categoryId !== undefined && !Number.isNaN(categoryId)) out = out.filter(c => c.category_id === categoryId);
  if (communeId !== undefined && !Number.isNaN(communeId)) out = out.filter(c => c.commune_id === communeId);
  if (active !== undefined) out = out.filter(c => c.is_active === active);
  if (operatorType !== undefined) out = out.filter(c => c.operator_type === operatorType);
  return res.json(out);
});

router.get('/centers/:center_id', (req, res) => {
  const id = Number(req.params.center_id);
  const center = db.geo.centers.find(c => c.center_id === id);
  if (!center) return error(res, 404, 'NOT_FOUND', 'Center not found.');
  return res.json(center);
});

module.exports = router;
