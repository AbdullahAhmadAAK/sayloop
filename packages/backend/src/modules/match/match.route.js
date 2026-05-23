const { Router } = require('express');
const { clerkAuth, resolveDbUser, protect } = require('../../middleware/auth.middleware');
const matchController = require('./match.controller');

const router = Router();

router.use(clerkAuth, resolveDbUser, protect);

router.get('/pending', matchController.pending);
router.get('/:matchId', matchController.getOne);
router.post('/', matchController.sendRequest);
router.post('/:matchId/accept', matchController.accept);
router.post('/:matchId/reject', matchController.reject);

module.exports = router;
