const { isProd, frontendUrl } = require('./env');

function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/\/$/, '');
}

/** Comma-separated extra origins from FRONTEND_URLS */
function getAllowedOrigins() {
  const primary = normalizeOrigin(frontendUrl);
  const fromEnv = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);

  const origins = new Set();
  if (primary) origins.add(primary);
  fromEnv.forEach((o) => origins.add(o));

  if (!isProd) {
    [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].forEach((o) => origins.add(o));
  }

  return [...origins];
}

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isVercelPreviewOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isOriginAllowed(origin) {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  const allowed = getAllowedOrigins();

  if (allowed.includes(normalized)) return true;
  if (!isProd && isLocalDevOrigin(origin)) return true;

  if (process.env.ALLOW_VERCEL_PREVIEWS !== 'false' && isVercelPreviewOrigin(origin)) {
    return true;
  }

  return false;
}

/**
 * Dynamic CORS for Express + Socket.IO (credentials-safe).
 * @param {string | undefined} origin
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
function corsOrigin(origin, callback) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }

  if (!isProd) {
    console.warn(`[cors] blocked origin: ${origin}. Add to FRONTEND_URL or FRONTEND_URLS.`);
  }

  callback(null, false);
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

module.exports = {
  getAllowedOrigins,
  corsOrigin,
  corsOptions,
  isLocalDevOrigin,
  isOriginAllowed,
  normalizeOrigin,
};
