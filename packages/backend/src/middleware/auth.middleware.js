const { clerkSecretKey } = require('../config/env');
const usersRepo = require('../db/users.repo');

async function clerkAuth(req, res, next) {
  if (!clerkSecretKey) {
    return res.status(500).json({
      success: false,
      message: 'CLERK_SECRET_KEY is not configured on the server',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing Authorization Bearer token' });
  }

  const token = authHeader.slice(7);
  try {
    const { verifyToken } = require('@clerk/clerk-sdk-node');
    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    req.auth = payload;
    req.clerkUserId = payload.sub;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session' });
  }
}

async function resolveDbUser(req, res, next) {
  try {
    const dbUser = await usersRepo.findByClerkId(req.clerkUserId);
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Call POST /api/users/sync first.',
      });
    }
    req.dbUser = dbUser;
    req.dbUserId = dbUser.id;
    return next();
  } catch (err) {
    return next(err);
  }
}

function protect(req, res, next) {
  if (!req.dbUserId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  return next();
}

async function optionalClerkAuth(req, _res, next) {
  if (!clerkSecretKey) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.slice(7);
  try {
    const { verifyToken } = require('@clerk/clerk-sdk-node');
    const payload = await verifyToken(token, { secretKey: clerkSecretKey });
    req.auth = payload;
    req.clerkUserId = payload.sub;
  } catch {
    /* optional */
  }
  next();
}

module.exports = {
  clerkAuth,
  resolveDbUser,
  protect,
  optionalClerkAuth,
};
