const { getOnlineUsers } = require('../presence/presence.store');
const matchService = require('./match.service');

async function browse(req, res, next) {
  try {
    const online = await matchService.browseOnlineUsers(
      req.dbUserId,
      getOnlineUsers(req.dbUserId),
    );
    res.json({ success: true, users: online });
  } catch (err) {
    next(err);
  }
}

async function pending(req, res, next) {
  try {
    const requests = await matchService.getPendingRequests(req.dbUserId);
    res.json({ success: true, requests });
  } catch (err) {
    next(err);
  }
}

async function sendRequest(req, res, next) {
  try {
    const partnerId = Number(req.body.partnerId);
    const { topic } = req.body;
    if (!partnerId || !topic) {
      return res.status(400).json({ success: false, message: 'partnerId and topic required' });
    }

    const { match, requester, receiver } = await matchService.createMatch(
      req.dbUserId,
      partnerId,
      topic,
    );

    if (!requester || !receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const request = matchService.formatMatchRequest(match, requester);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${partnerId}`).emit('match:request-received', { request });
    }

    res.status(201).json({
      success: true,
      matchId: match.id,
      partner: matchService.formatPartner(receiver),
      topic,
      request: matchService.formatMatchRequest(match, requester),
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const match = await matchService.getMatchById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    const uid = Number(req.dbUserId);
    if (uid !== Number(match.requesterId) && uid !== Number(match.receiverId)) {
      return res.status(403).json({ success: false, message: 'Not your match' });
    }

    const payload = await matchService.formatMatchPayload(match, req.dbUserId);
    res.json({ success: true, ...payload });
  } catch (err) {
    next(err);
  }
}

async function accept(req, res, next) {
  try {
    const { match } = await matchService.acceptMatch(req.params.matchId, req.dbUserId);
    const io = req.app.get('io');

    if (io) {
      const requesterId = Number(match.requesterId);
      const receiverId = Number(match.receiverId);
      const forRequester = await matchService.formatMatchPayload(match, requesterId);
      const forReceiver = await matchService.formatMatchPayload(match, receiverId);
      io.to(`user:${requesterId}`).emit('match:accepted', forRequester);
      io.to(`user:${receiverId}`).emit('match:accepted', forReceiver);
    }

    res.json({
      success: true,
      ...(await matchService.formatMatchPayload(match, req.dbUserId)),
    });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const match = await matchService.rejectMatch(req.params.matchId, req.dbUserId);
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${match.requesterId}`).emit('match:rejected', { matchId: match.id });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { browse, pending, getOne, sendRequest, accept, reject };
