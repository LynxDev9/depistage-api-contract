// routes/events.js — mobile analytics events (contract v3.8.0)
//
// POST /events needs MobileAnonymousBearer. The device and session are the
// ones in the token; a body that carries a different `device_uuid` or
// `session_id` is refused with 403 rather than overwritten.
//
// The AdminWeb dashboard counts ten events (five dashboard events and five
// chatbot events). Each one has an exact shape, checked here as the real API
// does: an event the dashboard could not use is refused with 422 instead of
// being stored and counted as zero. Every other event name is stored as is.

const express = require('express');
const { db, VALID, error, requireBearer } = require('../db');

const router = express.Router();

const MODULES = [
  'content', 'geo', 'referral', 'self_assessment', 'chatbot',
  'notification', 'survey', 'faq', 'session',
];
const CHANNELS = ['text', 'banner', 'infographic', 'audio', 'video', 'chatbot', 'notification'];
const CONTENT_CHANNELS = ['text', 'banner', 'infographic', 'audio', 'video'];
const CHATBOT_EVENTS = [
  'chatbot_started', 'chatbot_step_viewed', 'chatbot_choice_selected',
  'chatbot_action_triggered', 'chatbot_completed',
];

const MAX_METADATA_BYTES = 4096;
const EVENT_NAME = /^[a-z0-9_.:-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isAbsent = (v) => v === undefined || v === null;
const isInt = (v, min) => Number.isInteger(v) && v >= min;

// The metadata keys an event carries must be exactly `required` plus any of
// `optional`: one more, one fewer or a wrong type is a 422.
function hasOnlyKeys(metadata, required, optional = []) {
  if (!isPlainObject(metadata)) return false;
  const keys = Object.keys(metadata);
  return required.every(k => keys.includes(k)) &&
    keys.every(k => required.includes(k) || optional.includes(k));
}

function invalidField(res, field) {
  return error(res, 422, 'VALIDATION_ERROR', `Invalid value for field '${field}'.`);
}

function violation(res, message) {
  return error(res, 422, 'VALIDATION_ERROR', message);
}

// Returns an error message, or null when the event follows its convention.
function conventionError(e) {
  const m = e.metadata;

  switch (e.event_name) {
    case 'content_viewed': {
      const ok =
        e.module === 'content' &&
        isInt(e.content_id, 1) &&
        !isAbsent(e.language) &&
        CONTENT_CHANNELS.includes(e.channel) &&
        hasOnlyKeys(m, ['duration_sec'], ['completed']) &&
        isInt(m.duration_sec, 0) &&
        (m.completed === undefined || typeof m.completed === 'boolean');
      return ok ? null :
        "content_viewed events must use module 'content', a content_id, a language, a channel among text, banner, infographic, audio and video, and metadata with only duration_sec (integer of 0 or more) and an optional completed (true or false).";
    }
    case 'notification_opened': {
      const ok =
        e.module === 'notification' &&
        e.channel === 'notification' &&
        !isAbsent(e.language) &&
        hasOnlyKeys(m, ['notification_id']) &&
        isInt(m.notification_id, 1);
      return ok ? null :
        "notification_opened events must use module 'notification', channel 'notification', a language, and metadata with only notification_id (integer of 1 or more).";
    }
    case 'self_assessment_started': {
      const ok =
        e.module === 'self_assessment' &&
        isAbsent(e.channel) &&
        !isAbsent(e.language) &&
        hasOnlyKeys(m, ['quiz_id']) &&
        typeof m.quiz_id === 'string' && UUID.test(m.quiz_id);
      return ok ? null :
        "self_assessment_started events must use module 'self_assessment', no channel, a language, and metadata with only quiz_id (UUID).";
    }
    case 'center_search_performed': {
      const flags = ['used_text', 'used_filter', 'used_nearby', 'opened_center'];
      const ok =
        e.module === 'geo' &&
        isAbsent(e.channel) &&
        hasOnlyKeys(m, flags) &&
        flags.every(k => typeof m[k] === 'boolean') &&
        flags.some(k => m[k] === true);
      return ok ? null :
        "center_search_performed events must use module 'geo', no channel, and metadata with exactly used_text, used_filter, used_nearby and opened_center (booleans, at least one true).";
    }
    case 'center_map_redirected': {
      const ok =
        e.module === 'geo' &&
        isAbsent(e.channel) &&
        isInt(e.center_id, 1) &&
        (isAbsent(m) || (isPlainObject(m) && Object.keys(m).length === 0));
      return ok ? null :
        "center_map_redirected events must use module 'geo', no channel, a center_id, and no metadata.";
    }
    default:
      break;
  }

  // Chatbot convention: the module and the five names go together.
  if (e.module === 'chatbot' || CHATBOT_EVENTS.includes(e.event_name)) {
    const isChoice = e.event_name === 'chatbot_choice_selected';
    const required = ['chat_run_id', 'scenario_id', 'step_key'];
    if (isChoice) required.push('choice_id');
    const ok =
      e.module === 'chatbot' &&
      CHATBOT_EVENTS.includes(e.event_name) &&
      isAbsent(e.channel) &&
      hasOnlyKeys(m, required) &&
      typeof m.chat_run_id === 'string' && UUID.test(m.chat_run_id) &&
      isInt(m.scenario_id, 1) &&
      typeof m.step_key === 'string' && m.step_key.length > 0 &&
      (!isChoice || isInt(m.choice_id, 1));
    return ok ? null :
      "chatbot events must use module 'chatbot', one of the five chatbot event names, no channel, and metadata with only chat_run_id (UUID), scenario_id, step_key and, for chatbot_choice_selected only, choice_id.";
  }

  return null;
}

// POST /events
router.post('/', requireBearer, (req, res) => {
  const e = req.body;
  if (!isPlainObject(e)) {
    return violation(res, 'Request body must be a JSON object.');
  }

  // Compatibility fields: allowed, but they must be the token's own.
  if (!isAbsent(e.device_uuid) && e.device_uuid !== req.auth.device_uuid) {
    return error(res, 403, 'FORBIDDEN', 'device_uuid does not match the access token.');
  }
  if (!isAbsent(e.session_id) && e.session_id !== req.auth.session_id) {
    return error(res, 403, 'FORBIDDEN', 'session_id does not match the access token.');
  }

  if (typeof e.event_name !== 'string' || e.event_name.length === 0 ||
      e.event_name.length > 100 || !EVENT_NAME.test(e.event_name)) {
    return invalidField(res, 'event_name');
  }
  if (!MODULES.includes(e.module)) return invalidField(res, 'module');
  if (!isAbsent(e.channel) && !CHANNELS.includes(e.channel)) return invalidField(res, 'channel');
  if (!isAbsent(e.language) && !VALID.language.includes(e.language)) return invalidField(res, 'language');
  if (!isAbsent(e.metadata) && !isPlainObject(e.metadata)) return invalidField(res, 'metadata');
  if (!isAbsent(e.metadata) && Buffer.byteLength(JSON.stringify(e.metadata)) > MAX_METADATA_BYTES) {
    return invalidField(res, 'metadata');
  }

  for (const field of ['content_id', 'center_id', 'region_id', 'province_id']) {
    if (!isAbsent(e[field]) && !isInt(e[field], 1)) return invalidField(res, field);
  }
  // An id that no longer exists (a centre deleted since the app cached it) is
  // a 422, not a 500.
  if (!isAbsent(e.center_id) && !db.geo.centers.some(c => c.center_id === e.center_id)) {
    return invalidField(res, 'center_id');
  }
  if (!isAbsent(e.region_id) && !db.geo.regions.some(r => r.region_id === e.region_id)) {
    return invalidField(res, 'region_id');
  }
  if (!isAbsent(e.province_id) && !db.geo.provinces.some(p => p.province_id === e.province_id)) {
    return invalidField(res, 'province_id');
  }

  const problem = conventionError(e);
  if (problem) return violation(res, problem);

  db.events.push({
    event_name: e.event_name,
    module: e.module,
    channel: e.channel ?? null,
    language: e.language ?? null,
    content_id: e.content_id ?? null,
    center_id: e.center_id ?? null,
    region_id: e.region_id ?? null,
    province_id: e.province_id ?? null,
    metadata: e.metadata ?? null,
    // Owner and time come from the server, never from the body.
    device_uuid: req.auth.device_uuid,
    session_id: req.auth.session_id,
    received_at: new Date().toISOString(),
  });

  return res.status(202).json({ accepted: true });
});

module.exports = router;
