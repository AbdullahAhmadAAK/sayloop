const express = require('express');
const { clerkAuth, resolveDbUser, protect } = require('../../middleware/auth.middleware');
const { postSync, putMe, getMe, browseOnline } = require('./user.controller');

const router = express.Router();

router.post('/sync', clerkAuth, postSync);
router.get('/me', clerkAuth, resolveDbUser, protect, getMe);
router.get('/browse', clerkAuth, resolveDbUser, protect, browseOnline);
router.put('/me', clerkAuth, resolveDbUser, putMe);

module.exports = router;
