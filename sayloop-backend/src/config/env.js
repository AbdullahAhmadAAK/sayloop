require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const required = ['CLERK_SECRET_KEY', 'PORT', 'FRONTEND_URL'];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length === 0) {
    return;
  }

  const message = `Missing environment variables: ${missing.join(', ')}`;

  if (isProd) {
    throw new Error(message);
  }

  console.warn(`[env] ${message}`);
}

if (!process.env.PORT) {
  process.env.PORT = '4000';
}

if (!process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL = 'http://localhost:5173';
}

validateEnv();

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  frontendUrl: process.env.FRONTEND_URL,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  databaseUrl: process.env.DATABASE_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
};
