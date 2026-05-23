import type { TopicId } from '@/constants/topics';
import { fetchCoachingAnalyze, fetchTranscribeDebate, type CoachingAnalyzeResult } from '@/lib/api';
import { getRecordedBlobSync, normalizeAudioMime, stopDebateRecording } from '@/lib/debateAudioCapture';

const STORAGE_KEY = 'sayloop_pending_coach';

export type TranscriptLine = {
  text: string;
  at: number;
};

export type CoachMetrics = {
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

export type AnalysisStatus = 'idle' | 'running' | 'done' | 'error';

export type PendingCoachSession = {
  sessionId: string;
  topic: TopicId;
  partnerName: string;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  lines: TranscriptLine[];
  analyzed: boolean;
  analysisStatus: AnalysisStatus;
  coachingNarrative?: string;
  metrics?: CoachMetrics;
  analysisError?: string;
  source?: CoachingAnalyzeResult['source'];
};

type CoachListener = (pending: PendingCoachSession | null) => void;
const listeners = new Set<CoachListener>();
let analysisPromise: Promise<void> | null = null;
let cachedAudioBlob: Blob | null = null;

function notifyListeners() {
  const pending = loadPendingCoach();
  listeners.forEach((fn) => fn(pending));
}

export function subscribeCoachSession(fn: CoachListener) {
  listeners.add(fn);
  fn(loadPendingCoach());
  return () => listeners.delete(fn);
}

export function loadPendingCoach(): PendingCoachSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCoachSession;
    if (!parsed.analysisStatus) {
      parsed.analysisStatus = parsed.analyzed ? 'done' : 'idle';
    }
    return parsed;
  } catch {
    return null;
  }
}

export function savePendingCoach(data: PendingCoachSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function appendTranscriptLine(sessionId: string, text: string) {
  const pending = loadPendingCoach();
  const sid = String(sessionId);
  if (!pending || String(pending.sessionId) !== sid) return;
  const line = text.trim();
  if (!line) return;
  pending.lines.push({ text: line, at: Date.now() });
  savePendingCoach(pending);
  notifyListeners();
}

export function initCoachSession(payload: {
  sessionId: string;
  topic: TopicId;
  partnerName: string;
}) {
  const sid = String(payload.sessionId);
  const existing = loadPendingCoach();

  if (existing && String(existing.sessionId) === sid) {
    existing.topic = payload.topic;
    existing.partnerName = payload.partnerName;
    if (!existing.startedAt) existing.startedAt = Date.now();
    savePendingCoach(existing);
    notifyListeners();
    return;
  }

  analysisPromise = null;
  cachedAudioBlob = null;
  savePendingCoach({
    sessionId: sid,
    topic: payload.topic,
    partnerName: payload.partnerName,
    startedAt: Date.now(),
    endedAt: 0,
    durationSeconds: 0,
    lines: [],
    analyzed: false,
    analysisStatus: 'idle',
  });
  notifyListeners();
}

const ANALYSIS_DELAY_MS = 400;

export function finalizeCoachSession(sessionId: string, durationSeconds: number) {
  const pending = loadPendingCoach();
  const sid = String(sessionId);
  if (!pending || String(pending.sessionId) !== sid) return;
  pending.endedAt = Date.now();
  pending.durationSeconds = durationSeconds;
  pending.analysisStatus = 'idle';
  pending.analysisError = undefined;
  savePendingCoach(pending);
  notifyListeners();
  void captureDebateAudioBlob().then(() => scheduleCoachAnalysis(ANALYSIS_DELAY_MS));
}

export async function captureDebateAudioBlob() {
  try {
    const blob = (await stopDebateRecording()) ?? getRecordedBlobSync();
    if (blob && blob.size >= 256) {
      cachedAudioBlob = blob;
    }
  } catch {
    const fallback = getRecordedBlobSync();
    if (fallback && fallback.size >= 256) {
      cachedAudioBlob = fallback;
    }
  }
}

export function scheduleCoachAnalysis(delayMs = ANALYSIS_DELAY_MS) {
  if (delayMs <= 0) {
    void startCoachAnalysis();
    return;
  }
  setTimeout(() => void startCoachAnalysis(), delayMs);
}

export function getTranscriptText(pending: PendingCoachSession): string {
  return pending.lines.map((l) => l.text).join(' ').trim();
}

function userFacingTranscribeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('OPENAI_API_KEY') || msg.includes('Speech analysis is unavailable')) {
    return msg;
  }
  if (msg.includes('CORS') || msg.includes('Failed to fetch') || msg.includes('Network')) {
    return `Cannot reach the API for transcription. Check VITE_API_URL on Vercel and FRONTEND_URL on AWS. (${msg})`;
  }
  if (msg.includes('401') || msg.includes('Unauthorized')) {
    return 'Sign-in expired — refresh the page and try Retry.';
  }
  if (msg.includes('413')) {
    return 'Recording too large for the server. Ask your host to allow uploads up to 12MB.';
  }
  return msg || 'Transcription failed. Tap Retry.';
}

async function ensureTranscriptFromAudio(pending: PendingCoachSession): Promise<string> {
  const existing = getTranscriptText(pending);
  if (existing) return existing;

  const blob = cachedAudioBlob ?? (await stopDebateRecording()) ?? getRecordedBlobSync();
  if (!blob || blob.size < 256) {
    return '';
  }

  const latest = loadPendingCoach();
  if (!latest) return '';

  try {
    const uploadBlob =
      blob.type && blob.type !== normalizeAudioMime(blob.type)
        ? new Blob([blob], { type: normalizeAudioMime(blob.type) })
        : blob;

    const res = await fetchTranscribeDebate(uploadBlob);
    const text = res.text?.trim();
    if (!text) {
      return getTranscriptText(latest);
    }

    const updated = loadPendingCoach();
    if (!updated) return text;

    updated.lines = [{ text, at: updated.startedAt }];
    savePendingCoach(updated);
    notifyListeners();
    cachedAudioBlob = null;
    return text;
  } catch (err) {
    console.warn('[coach] Whisper transcribe failed', err);
    const failed = loadPendingCoach();
    if (failed && !getTranscriptText(failed)) {
      failed.analysisError = userFacingTranscribeError(err);
      savePendingCoach(failed);
      notifyListeners();
    }
    throw err;
  }
}

/** Runs GPT analysis in the background as soon as the debate ends. */
export function markCoachAnalyzed(coachingNarrative?: string, metrics?: CoachMetrics) {
  const pending = loadPendingCoach();
  if (!pending) return;
  pending.analyzed = true;
  pending.analysisStatus = 'done';
  if (coachingNarrative) pending.coachingNarrative = coachingNarrative;
  if (metrics) pending.metrics = metrics;
  savePendingCoach(pending);
  notifyListeners();
}

export function ensureCoachAnalysisStarted() {
  const pending = loadPendingCoach();
  if (!pending) return;
  if (pending.analysisStatus === 'done' || pending.analysisStatus === 'running') return;
  if (pending.endedAt > 0 || pending.durationSeconds > 0) {
    if (pending.analysisStatus === 'error' && pending.analysisError?.includes('OPENAI_API_KEY')) {
      return;
    }
    if (pending.analysisStatus === 'error' && !getTranscriptText(pending) && !cachedAudioBlob) {
      return;
    }
    scheduleCoachAnalysis(pending.analysisStatus === 'error' ? 300 : 0);
  }
}

export function retryCoachAnalysis(): Promise<void> {
  analysisPromise = null;
  const pending = loadPendingCoach();
  if (!pending) return Promise.resolve();
  pending.analysisStatus = 'idle';
  pending.analysisError = undefined;
  pending.analyzed = false;
  savePendingCoach(pending);
  notifyListeners();
  return new Promise((resolve) => {
    setTimeout(() => {
      void (async () => {
        await captureDebateAudioBlob();
        await startCoachAnalysis();
      })().finally(resolve);
    }, 500);
  });
}

async function resolveTranscript(pending: PendingCoachSession): Promise<string> {
  const fromLines = getTranscriptText(pending);
  if (fromLines.length >= 3) {
    return fromLines;
  }

  try {
    const fromWhisper = await ensureTranscriptFromAudio(pending);
    if (fromWhisper) return fromWhisper;
  } catch (err) {
    if (fromLines) return fromLines;
    throw err;
  }

  return getTranscriptText(loadPendingCoach() ?? pending) || fromLines;
}

export function startCoachAnalysis(): Promise<void> {
  if (analysisPromise) return analysisPromise;

  analysisPromise = (async () => {
    let pending = loadPendingCoach();
    if (!pending) return;

    if (pending.analysisStatus === 'done') {
      return;
    }

    pending.analysisStatus = 'running';
    pending.analysisError = undefined;
    savePendingCoach(pending);
    notifyListeners();

    let transcript = '';
    try {
      transcript = await resolveTranscript(pending);
    } catch (err) {
      pending = loadPendingCoach() ?? pending;
      pending.analysisStatus = 'error';
      pending.analysisError = userFacingTranscribeError(err);
      savePendingCoach(pending);
      notifyListeners();
      return;
    }

    if (!transcript || transcript.length < 3) {
      pending = loadPendingCoach() ?? pending;
      pending.analysisStatus = 'error';
      const hadAudio = Boolean(cachedAudioBlob && cachedAudioBlob.size >= 256);
      pending.analysisError = hadAudio
        ? 'We heard audio but could not detect clear speech. Speak louder, closer to the mic, for the full minute, then tap Retry.'
        : 'No speech was captured. Allow the microphone in Chrome/Edge, stay unmuted during the debate, then tap Retry.';
      savePendingCoach(pending);
      notifyListeners();
      return;
    }

    pending = loadPendingCoach() ?? pending;

    try {
      const res = await fetchCoachingAnalyze({
        transcript,
        topicId: pending.topic,
        durationSeconds: pending.durationSeconds || 60,
        lines: pending.lines,
        sessionStartMs: pending.startedAt,
      });

      const latest = loadPendingCoach();
      if (!latest || latest.sessionId !== pending.sessionId) return;

      if (!res.success || !res.coachingNarrative) {
        throw new Error('Coach could not analyze this session');
      }

      latest.analysisStatus = 'done';
      latest.analyzed = true;
      latest.coachingNarrative = res.coachingNarrative;
      latest.metrics = res.metrics;
      latest.source = res.source;
      savePendingCoach(latest);
    } catch (err) {
      const latest = loadPendingCoach();
      if (!latest) return;
      latest.analysisStatus = 'error';
      latest.analysisError =
        err instanceof Error ? err.message : 'Analysis failed. Check your connection.';
      savePendingCoach(latest);
    } finally {
      notifyListeners();
      analysisPromise = null;
    }
  })();

  return analysisPromise;
}

export function clearPendingCoach() {
  analysisPromise = null;
  cachedAudioBlob = null;
  sessionStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}
