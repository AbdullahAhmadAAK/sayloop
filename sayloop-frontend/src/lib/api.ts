import axios, { type AxiosError } from 'axios';
import { resolveApiBase } from '@/lib/env';

const root = resolveApiBase();

export const api = axios.create({
  baseURL: root ? `${root}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
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

export function getApiErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.code === 'ERR_NETWORK' || !err.response) {
    if (import.meta.env.DEV) {
      return 'Cannot reach API. Start backend: cd sayloop-backend && npm run dev (port 4000).';
    }
    return 'Cannot reach server. Check VITE_API_URL and that the API is running.';
  }
  if (err.response?.status === 403 || err.message?.includes('CORS')) {
    return 'CORS blocked this request. Set FRONTEND_URL on the API to match this site URL.';
  }
  return err.response?.data?.message ?? err.message ?? 'Request failed';
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (import.meta.env.DEV) {
      const err = error as AxiosError;
      if (err.code === 'ERR_NETWORK') {
        console.error(
          '[api] Network error — is sayloop-backend running on port 4000? Using proxy:',
          !resolveApiBase(),
        );
      }
    }
    return Promise.reject(error);
  },
);

export async function updateUserProfile(body: Record<string, unknown>) {
  const { data } = await api.put<{ success: boolean; user: unknown }>('/users/me', body);
  return data;
}

export async function fetchNicknameSuggestions(seed: string, lastName?: string) {
  const { data } = await api.post<{
    success: boolean;
    suggestions: string[];
    source: 'gemini' | 'fallback';
  }>('/ai/nickname-suggestions', { seed, firstName: seed, lastName });
  return data;
}

export async function fetchStuckPrompts(topicId: string, refresh = false) {
  const { data } = await api.post<{
    success: boolean;
    prompts: string[];
    source: 'gemini' | 'fallback';
  }>('/ai/stuck-prompts', { topicId, refresh });
  return data;
}

export type CoachingAnalyzeResult = {
  success: boolean;
  coachingNarrative: string;
  metrics?: {
    wordCount: number;
    wpm: number;
    wpmLabel: string;
    fillerTotal: number;
    durationSeconds: number;
  };
  source: 'openai' | 'fallback';
};

export async function fetchCoachingAnalyze(body: {
  transcript: string;
  topicId: string;
  durationSeconds: number;
}) {
  const { data } = await api.post<CoachingAnalyzeResult>('/ai/coaching-analyze', body, {
    timeout: 45000,
  });
  return data;
}
