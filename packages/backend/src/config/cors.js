const { isProd, frontendUrl } = require('./env');

/** Comma-separated extra origins, e.g. http://localhost:5174 */
function getAllowedOrigins() {
  const fromEnv = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const origins = new Set([frontendUrl, ...fromEnv]);

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
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

/**
 * @param {string | undefined} origin
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
function corsOrigin(origin, callback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    callback(null, true);
    return;
  }

  if (!isProd && isLocalDevOrigin(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked origin: ${origin}`));
}

module.exports = { getAllowedOrigins, corsOrigin, isLocalDevOrigin };
