// routes/chatbot.js — scripted chatbot decision tree (contract v3.5.0)
//
// GET /chatbot needs MobileAnonymousBearer. The language is the one of the
// authenticated device's profile: the contract has no language parameter, and
// after a language change the app patches the profile and fetches again.
//
// What the wire shows is a strict projection of chatbotSeed.js, restricted to
// the steps reachable from the start step.

const express = require('express');
const { db, error, requireBearer } = require('../db');

const router = express.Router();

function profileLanguage(deviceUuid) {
  const user = db.users.find(u => u.device_uuid === deviceUuid);
  return user && user.language === 'ar' ? 'ar' : 'fr';
}

function publishedScenario() {
  const scenario = db.chatbot.scenario;
  return scenario && scenario.published ? scenario : null;
}

// Steps reachable from the start step. The tree may contain cycles, hence the
// visited set; `steps` order carries no meaning on the wire.
function reachableSteps(scenario) {
  const byId = new Map(scenario.steps.map(step => [step.step_id, step]));
  const seen = new Set();
  const queue = [scenario.start_step_id];
  while (queue.length > 0) {
    const stepId = queue.shift();
    if (seen.has(stepId)) continue;
    seen.add(stepId);
    for (const c of byId.get(stepId).choices) queue.push(c.next_step_id);
  }
  return scenario.steps.filter(step => seen.has(step.step_id));
}

// Whitelist projection: fields are named one by one.
function toChatbotResponse(scenario, lang) {
  const text = (value) => (value === null ? null : value[lang]);
  return {
    scenario_id: scenario.scenario_id,
    title: scenario.title[lang],
    start_step_id: scenario.start_step_id,
    steps: reachableSteps(scenario).map(step => ({
      step_id: step.step_id,
      step_key: step.step_key,
      step_type: step.step_type,
      message: text(step.message),
      action_type: step.action_type,
      choices: step.choices.map(c => ({
        choice_id: c.choice_id,
        label: c.label[lang],
        next_step_id: c.next_step_id,
      })),
    })),
  };
}

// GET /chatbot
router.get('/', requireBearer, (req, res) => {
  const scenario = publishedScenario();
  if (!scenario) return error(res, 404, 'NOT_FOUND', 'No published chatbot is available.');

  // The tree is served in one device's language: never in a shared cache.
  res.set('Cache-Control', 'private, no-store');
  return res.json(toChatbotResponse(scenario, profileLanguage(req.auth.device_uuid)));
});

module.exports = router;
