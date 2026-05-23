const userService = require('./user.service');
const { getOnlineUsers } = require('../presence/presence.store');

async function postSync(req, res, next) {
  try {
    const { email, firstName, lastName, pfpSource } = req.body;
    const user = await userService.syncUser(req.clerkUserId, {
      email,
      firstName,
      lastName,
      pfpSource,
    });
    res.json({
      success: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        onboardingComplete: user.onboardingComplete,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    res.json({ success: true, user: req.dbUser });
  } catch (err) {
    next(err);
  }
}

async function putMe(req, res, next) {
  try {
    const user = await userService.updateProfile(req.clerkUserId, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function browseOnline(req, res, next) {
  try {
    const users = getOnlineUsers(req.dbUserId);
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
}

module.exports = { postSync, getMe, putMe, browseOnline };
