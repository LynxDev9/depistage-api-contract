// routes/partnerLinks.js — partner links (contract v3.9.0 / v3.10.0)
//
// GET /partner-links is PUBLIC: no MobileAnonymousBearer. Staff manage the links
// in AdminWeb; the app only reads them.
//
// Only links with a website or a phone are returned, ordered by
// `partner_link_id` (the four seeded links first, then the ones staff added).
// Links with `is_featured: true` — four at most — stay in the same list and
// order: it is the app that shows them apart, before the other partners.

const express = require('express');
const { db } = require('../db');

const router = express.Router();

const hasDestination = (row) => row.url !== null || row.phone_number !== null;

// Whitelist projection: the eight fields of the contract, named one by one.
function toPartnerLink(row) {
  return {
    partner_link_id: row.partner_link_id,
    source_platform: row.source_platform,
    display_label: row.display_label,
    url: row.url,
    logo_url: row.logo_url,
    phone_label: row.phone_label,
    phone_number: row.phone_number,
    is_featured: row.is_featured,
  };
}

// GET /partner-links
router.get('/', (req, res) => {
  const items = db.partnerLinks
    .filter(hasDestination)
    .sort((a, b) => a.partner_link_id - b.partner_link_id)
    .map(toPartnerLink);

  return res.json(items);
});

module.exports = router;
