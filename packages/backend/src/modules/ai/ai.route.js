const express = require('express');
const { getNicknameSuggestions } = require('./ai.controller');
const { optionalClerkAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/nickname-suggestions', optionalClerkAuth, getNicknameSuggestions);

module.exports = router;
