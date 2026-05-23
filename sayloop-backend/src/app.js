const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { corsOptions } = require('./config/cors');
const { isProd } = require('./config/env');
const { API_PREFIX, ROUTES } = require('./config/constants');
const { getDb } = require('./config/database');
const { errorHandler } = require('./middleware/error.middleware');
const { optionalClerkAuth } = require('./middleware/auth.middleware');
const { postTranscribeDebate } = require('./modules/ai/ai.controller');

function createApp() {
  const app = express();

  if (isProd) {
    app.set('trust proxy', 1);
  }

  app.use(morgan(isProd ? 'combined' : 'dev'));
  app.use(cors(corsOptions));

  // Transcribe: parse raw audio OR JSON base64 before the global JSON middleware.
  app.post(
    `${API_PREFIX}${ROUTES.AI}/transcribe-debate`,
    (req, res, next) => {
      const ct = String(req.headers['content-type'] || '');
      const isAudio = ct.startsWith('audio/') || ct === 'application/octet-stream';
      if (isAudio) {
        return express.raw({ type: () => true, limit: '12mb' })(req, res, next);
      }
      return express.json({ limit: '12mb' })(req, res, next);
    },
    optionalClerkAuth,
    postTranscribeDebate,
  );

  app.use(express.json({ limit: '12mb' }));

  app.get(`${API_PREFIX}${ROUTES.HEALTH}`, async (_req, res) => {
    const db = getDb();
    let database = 'not_configured';

    if (db) {
      try {
        await db.$queryRaw`SELECT 1`;
        database = 'connected';
      } catch {
        database = 'error';
      }
    }

    const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

    res.json({
      ok: true,
      service: 'sayloop-backend',
      database,
      openai: openaiConfigured,
      timestamp: new Date().toISOString(),
    });
  });

  app.get(`${API_PREFIX}`, (_req, res) => {
    res.json({
      message: 'SayLoop API',
      docs: 'See docs/PHASE-1-FOUNDATION-SETUP-GUIDE.md',
    });
  });

  const aiRouter = require('./modules/ai/ai.route');
  app.use(`${API_PREFIX}${ROUTES.AI}`, aiRouter);

  const userRouter = require('./modules/users/user.route');
  app.use(`${API_PREFIX}${ROUTES.USERS}`, userRouter);

  const matchRouter = require('./modules/match/match.route');
  app.use(`${API_PREFIX}${ROUTES.MATCHES}`, matchRouter);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.path}`,
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
