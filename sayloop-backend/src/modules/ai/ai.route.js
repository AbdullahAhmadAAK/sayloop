const express = require('express');
const {
  getNicknameSuggestions,
  getStuckPrompts,
  postCoachingAnalyze,
  postTranscribeDebate,
} = require('./ai.controller');
const { optionalClerkAuth } = require('../../middleware/auth.middleware');

const router = express.Router();
const transcribeRaw = express.raw({ type: () => true, limit: '12mb' });

router.post('/nickname-suggestions', optionalClerkAuth, getNicknameSuggestions);
router.post('/stuck-prompts', optionalClerkAuth, getStuckPrompts);
router.post('/coaching-analyze', optionalClerkAuth, postCoachingAnalyze);

router.post('/transcribe-debate', optionalClerkAuth, (req, res, next) => {
  const isBinary =
    req.is('audio/*') ||
    req.is('application/octet-stream') ||
    String(req.headers['content-type'] || '').startsWith('audio/');

  if (isBinary) {
    return transcribeRaw(req, res, (err) => {
      if (err) return next(err);
      return postTranscribeDebate(req, res, next);
    });
  }
  return postTranscribeDebate(req, res, next);
});

module.exports = router;
