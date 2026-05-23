import axios, { type AxiosError } from 'axios';
import { resolveApiBase } from '@/lib/env';

const root = resolveApiBase();

export const api = axios.create({
  baseURL: root ? `${root}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export function getApiRoot(): string {
  return root ? `${root}/api` : '/api';
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
    return `Cannot reach API at ${resolveApiBase() || 'server'}. Check VITE_API_URL on Vercel and that AWS is running.`;
  }
  if (err.response?.status === 413) {
    return 'Audio upload too large for the server. Try a shorter debate.';
  }
  if (err.response?.status === 403 || err.message?.includes('CORS')) {
    return 'CORS blocked this request. Set FRONTEND_URL on AWS to your Vercel URL.';
  }
  return err.response?.data?.message ?? err.message ?? 'Request failed';
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (import.meta.env.DEV) {
      const err = error as AxiosError;
      if (err.code === 'ERR_NETWORK') {
        console.error('[api] Network error — backend URL:', resolveApiBase() || '(vite proxy)');
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

export type CoachMetricsPayload = {
  wordCount: number;
  wpm: number;
  wpmLabel: string;
  fillerTotal: number;
  fillerCounts: Record<string, number>;
  pitchVariance: number;
  pitchLabel: string;
  speedVariation: number;
  speedVariationLabel: string;
  pauseCount: number;
  durationSeconds: number;
};

export type CoachingAnalyzeResult = {
  success: boolean;
  coachingNarrative: string;
  metrics?: CoachMetricsPayload;
  source: 'openai' | 'fallback';
};

async function authHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {};
  if (tokenGetter) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Raw audio upload — works better on AWS than large JSON base64. */
export async function fetchTranscribeDebate(audio: Blob) {
  const url = `${getApiRoot()}/ai/transcribe-debate`;
  const mime = audio.type || 'audio/webm';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(await authHeaders()),
        'Content-Type': mime,
      },
      body: audio,
      credentials: 'include',
      mode: 'cors',
    });

    const data = (await res.json()) as {
      success?: boolean;
      text?: string;
      source?: string;
      message?: string;
    };

    if (!res.ok) {
      throw new Error(data.message || `Transcribe failed (${res.status})`);
    }
    return { success: Boolean(data.success), text: data.text ?? '', source: data.source ?? '' };
  } catch (rawErr) {
    if (import.meta.env.DEV) {
      console.warn('[api] raw transcribe failed, trying base64', rawErr);
    }
  }

  const audioBase64 = await blobToBase64(audio);
  const { data } = await api.post<{ success: boolean; text: string; source: string; message?: string }>(
    '/ai/transcribe-debate',
    { audioBase64, mimeType: mime },
    { timeout: 120000 },
  );
  return data;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function fetchCoachingAnalyze(body: {
  transcript: string;
  topicId: string;
  durationSeconds: number;
  lines?: Array<{ text: string; at: number }>;
  sessionStartMs?: number;
}) {
  const { data } = await api.post<CoachingAnalyzeResult>('/ai/coaching-analyze', body, {
    timeout: 120000,
  });
  return data;
}
