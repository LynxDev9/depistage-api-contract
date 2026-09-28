// routes/assessment.js — anonymous auto-evaluation (contract v3.4.0)
//
// Both routes need MobileAnonymousBearer. The device is identified by the token
// alone: it is never read from the request body, and a body that tries to
// supply it (or a score, a risk level, weights…) is refused rather than
// ignored — the contract forbids sending them.
//
// What the wire shows is a strict projection of the seed in assessmentSeed.js.
// Weights, option scores, band thresholds, the classification an option sets
// and the device that owns a result never leave this file.

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, error, requireBearer } = require('../db');

const router = express.Router();

const INVALID_ANSWERS = 'Submit exactly one valid option for every assessment question.';

// The contract has no `language` query parameter here: the questionnaire is
// served in the language of the authenticated device's profile.
function profileLanguage(deviceUuid) {
  const user = db.users.find(u => u.device_uuid === deviceUuid);
  return user && user.language === 'ar' ? 'ar' : 'fr';
}

function publishedQuiz() {
  const quiz = db.assessment.quiz;
  return quiz && quiz.published ? quiz : null;
}

// Whitelist projection: fields are named one by one so that anything added to
// the seed later stays internal until it is deliberately exposed here.
function toQuizResponse(quiz, lang) {
  return {
    quiz_id: quiz.quiz_id,
    version: quiz.version,
    title: quiz.title[lang],
    questions: quiz.questions.map(question => ({
      question_id: question.question_id,
      text: question.text[lang],
      options: question.options.map(option => ({
        option_id: option.option_id,
        label: option.label[lang],
      })),
    })),
  };
}

function toResultResponse(result) {
  return {
    result_id: result.result_id,
    quiz_id: result.quiz_id,
    quiz_version: result.quiz_version,
    risk_level: result.risk_level,
    orientation: result.orientation,
    recommend_center: result.recommend_center,
    completed_at: result.completed_at,
  };
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

// GET /assessment/quiz
router.get('/quiz', requireBearer, (req, res) => {
  const quiz = publishedQuiz();
  if (!quiz) return error(res, 404, 'NOT_FOUND', 'No published assessment is available.');

  // One device's questionnaire (in its language) must never sit in a shared cache.
  res.set('Cache-Control', 'private, no-store');
  return res.json(toQuizResponse(quiz, profileLanguage(req.auth.device_uuid)));
});

// POST /assessment/results
router.post('/results', requireBearer, (req, res) => {
  const body = req.body;

  // Shape first (422), then which quiz (404), then the answer set (422).
  if (!isPlainObject(body)) {
    return error(res, 422, 'VALIDATION_ERROR', 'The request body must be a JSON object.');
  }
  const extraKeys = Object.keys(body).filter(k => k !== 'quiz_id' && k !== 'answers');
  if (extraKeys.length > 0) {
    return error(
      res, 422, 'VALIDATION_ERROR',
      `The request must contain only quiz_id and answers (unexpected: ${extraKeys.join(', ')}).`,
    );
  }
  if (!isNonEmptyString(body.quiz_id)) {
    return error(res, 422, 'VALIDATION_ERROR', "Missing required field: 'quiz_id'");
  }
  if (!Array.isArray(body.answers) || body.answers.length < 1 || body.answers.length > 100) {
    return error(res, 422, 'VALIDATION_ERROR', "Field 'answers' must be an array of 1 to 100 answers.");
  }
  for (const answer of body.answers) {
    const answerKeys = isPlainObject(answer) ? Object.keys(answer) : [];
    const wellFormed =
      answerKeys.length === 2 &&
      isNonEmptyString(answer.question_id) &&
      isNonEmptyString(answer.option_id);
    if (!wellFormed) {
      return error(res, 422, 'VALIDATION_ERROR', 'Each answer must contain only question_id and option_id.');
    }
  }

  const quiz = publishedQuiz();
  if (!quiz || quiz.quiz_id !== body.quiz_id) {
    return error(res, 404, 'NOT_FOUND', 'The quiz is not the current published questionnaire.');
  }

  // Exactly one option per question: no duplicate, no unknown question, no
  // option that belongs to another question, nothing left unanswered.
  const chosen = new Map(); // question_id -> option
  for (const answer of body.answers) {
    const question = quiz.questions.find(q => q.question_id === answer.question_id);
    if (!question || chosen.has(question.question_id)) {
      return error(res, 422, 'VALIDATION_ERROR', INVALID_ANSWERS);
    }
    const option = question.options.find(o => o.option_id === answer.option_id);
    if (!option) return error(res, 422, 'VALIDATION_ERROR', INVALID_ANSWERS);
    chosen.set(question.question_id, option);
  }
  if (chosen.size !== quiz.questions.length) {
    return error(res, 422, 'VALIDATION_ERROR', INVALID_ANSWERS);
  }

  // Score, band, and the classification the chosen options assign.
  let total = 0;
  let userType = null;
  let familySituation = null;
  for (const question of quiz.questions) {
    const option = chosen.get(question.question_id);
    total += question.weight * option.score;
    if (option.sets_user_type) userType = option.sets_user_type;
    if (option.sets_family_situation) familySituation = option.sets_family_situation;
  }
  const band = quiz.bands.find(b => total <= b.max_total);

  const deviceUuid = req.auth.device_uuid;
  const lang = profileLanguage(deviceUuid);
  const result = {
    result_id: uuidv4(),
    // Ownership and total score are stored, never returned.
    device_uuid: deviceUuid,
    total_score: total,
    quiz_id: quiz.quiz_id,
    quiz_version: quiz.version,
    risk_level: band.level,
    orientation: quiz.orientation[band.level][lang],
    recommend_center: band.level !== 'LOW',
    completed_at: new Date().toISOString(),
  };
  db.assessment.results.push(result);

  // Server-owned profile classification, updated together with the result.
  const user = db.users.find(u => u.device_uuid === deviceUuid);
  if (user) {
    if (userType) user.user_type = [userType];
    if (familySituation) user.family_situation = familySituation;
  }

  console.log(`[POST /assessment/results] ${result.risk_level} for device ${deviceUuid}`);
  return res.status(201).json(toResultResponse(result));
});

module.exports = router;
