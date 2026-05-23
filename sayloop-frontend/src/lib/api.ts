import axios from 'axios';

/** Use localhost in dev — never a dead remote URL (avoids 504). */
function resolveApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl && !envUrl.includes('replit.dev') && !envUrl.includes('placeholder')) {
    return envUrl.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  return envUrl?.replace(/\/$/, '') || '';
}

const root = resolveApiBase();

export const api = axios.create({
  baseURL: root ? `${root}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
      console.error(
        '[api] Backend unreachable. Start sayloop-backend: npm run dev (port 4000)',
      );
    }
    return Promise.reject(error);
  },
);

export async function updateUserProfile(body: Record<string, unknown>) {
  const { data } = await api.put<{ success: boolean; user: unknown }>('/users/me', body);
  return data;
}

export async function fetchNicknameSuggestions(firstName: string, lastName?: string) {
  const { data } = await api.post<{
    success: boolean;
    suggestions: string[];
    source: 'gemini' | 'fallback';
  }>('/ai/nickname-suggestions', { firstName, lastName });
  return data;
}
