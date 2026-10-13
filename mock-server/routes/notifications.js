// routes/notifications.js — in-app notifications (contract v3.7.1)
//
// GET /notifications is PUBLIC: no MobileAnonymousBearer. Nothing is pushed and
// nothing is stored per device; the app keeps its own read/unread state.
//
// Only PUBLISHED rows in the requested language are returned — a message is
// visible from its publication until staff archive it (v3.7.1: no start/end
// dates). Most recently published first, 20 at most, through a whitelist
// projection: `status` never leaves the server.

const express = require('express');
const { db, VALID, error } = require('../db');

const router = express.Router();

const MAX_ITEMS = 20;

function toNotification(row) {
  return {
    notification_id: row.notification_id,
    type: row.type,
    title: row.title,
    body: row.body,
    language: row.language,
    content_id: row.content_id,
    published_at: row.published_at,
    updated_at: row.updated_at,
  };
}

// GET /notifications?language=fr|ar
router.get('/', (req, res) => {
  const { language } = req.query;
  if (typeof language !== 'string' || !VALID.language.includes(language)) {
    return error(res, 422, 'VALIDATION_ERROR', 'language is required and must be fr or ar.');
  }

  const items = db.notifications
    .filter(row => row.status === 'PUBLISHED' && row.language === language)
    .sort((a, b) =>
      Date.parse(b.published_at) - Date.parse(a.published_at) ||
      b.notification_id - a.notification_id)
    .slice(0, MAX_ITEMS)
    .map(toNotification);

  return res.json(items);
});

module.exports = router;
