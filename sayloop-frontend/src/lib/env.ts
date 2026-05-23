/**
 * API / Socket URL resolution.
 *
 * Local dev: use same-origin + Vite proxy (no CORS). Set VITE_USE_DEV_PROXY=false
 * to call http://localhost:4000 directly (backend CORS must allow your Vite port).
 *
 * Production: set VITE_API_URL (and optionally VITE_SOCKET_URL) to your deployed API.
 */

/** Production API when VITE_* is missing from the build (Vercel should set env vars too). */
const PRODUCTION_API_DEFAULT = 'https://sayloop.ddns.net';

function trimUrl(url: string | undefined): string {
  return url?.trim().replace(/\/$/, '') ?? '';
}

function useViteProxyInDev(): boolean {
  if (!import.meta.env.DEV) return false;
  if (import.meta.env.VITE_USE_DEV_PROXY === 'true') return true;
  if (import.meta.env.VITE_USE_DEV_PROXY === 'false') return false;
  const api = trimUrl(import.meta.env.VITE_API_URL);
  const socket = trimUrl(import.meta.env.VITE_SOCKET_URL);
  // Explicit localhost URLs → connect directly to :4000 (avoids flaky Vite WS proxy).
  if (api || socket) return false;
  return true;
}

/** Empty string = relative `/api` (Vite proxy in dev). */
export function resolveApiBase(): string {
  if (useViteProxyInDev()) return '';

  const envUrl = trimUrl(import.meta.env.VITE_API_URL);
  if (envUrl && !envUrl.includes('replit.dev') && !envUrl.includes('placeholder')) {
    return envUrl;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }

  if (!envUrl) {
    console.warn('[env] VITE_API_URL missing — using default production API:', PRODUCTION_API_DEFAULT);
    return PRODUCTION_API_DEFAULT;
  }
  return envUrl;
}

export type SocketConnectConfig =
  | { mode: 'proxy' }
  | { mode: 'url'; url: string };

export function resolveSocketConnect(): SocketConnectConfig {
  if (useViteProxyInDev()) {
    return { mode: 'proxy' };
  }

  const socketUrl = trimUrl(import.meta.env.VITE_SOCKET_URL);
  if (socketUrl && !socketUrl.includes('replit.dev')) {
    return { mode: 'url', url: socketUrl };
  }

  const apiUrl = trimUrl(import.meta.env.VITE_API_URL);
  if (apiUrl && !apiUrl.includes('replit.dev')) {
    return { mode: 'url', url: apiUrl };
  }

  if (import.meta.env.DEV) {
    return { mode: 'url', url: 'http://localhost:4000' };
  }

  const fallback = trimUrl(import.meta.env.VITE_API_URL) || PRODUCTION_API_DEFAULT;
  return { mode: 'url', url: fallback };
}

export function isUsingDevProxy(): boolean {
  return useViteProxyInDev();
}
