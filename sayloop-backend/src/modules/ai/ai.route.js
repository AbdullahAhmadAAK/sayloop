const express = require('express');
const {
  getNicknameSuggestions,
  getStuckPrompts,
  postCoachingAnalyze,
} = require('./ai.controller');
const { optionalClerkAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/nickname-suggestions', optionalClerkAuth, getNicknameSuggestions);
router.post('/stuck-prompts', optionalClerkAuth, getStuckPrompts);
router.post('/coaching-analyze', optionalClerkAuth, postCoachingAnalyze);

module.exports = router;
