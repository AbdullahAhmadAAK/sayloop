import type { TopicId } from '@/constants/topics';
import { fetchCoachingAnalyze, fetchTranscribeDebate, type CoachingAnalyzeResult } from '@/lib/api';
import { stopDebateRecording } from '@/lib/debateAudioCapture';

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
  if (cachedAudioBlob && cachedAudioBlob.size >= 800) {
    scheduleCoachAnalysis(ANALYSIS_DELAY_MS);
  } else {
    void captureDebateAudioBlob().then(() => scheduleCoachAnalysis(ANALYSIS_DELAY_MS));
  }
}

export async function captureDebateAudioBlob() {
  try {
    cachedAudioBlob = await stopDebateRecording();
  } catch {
    cachedAudioBlob = null;
  }
}

export function scheduleCoachAnalysis(delayMs = ANALYSIS_DELAY_MS) {
  if (delayMs <= 0) {
    void startCoachAnalysis();
    return;
  }
  setTimeout(() => void startCoachAnalysis(), delayMs);
}

async function ensureTranscriptFromAudio() {
  const pending = loadPendingCoach();
  if (!pending || getTranscriptText(pending)) return;

  const blob = cachedAudioBlob ?? (await stopDebateRecording());
  cachedAudioBlob = null;
  if (!blob || blob.size < 800) return;

  const latest = loadPendingCoach();
  if (!latest) return;

  try {
    const res = await fetchTranscribeDebate(blob);
    const text = res.text?.trim();
    if (!text) return;

    const updated = loadPendingCoach();
    if (!updated) return;

    updated.lines = [{ text, at: updated.startedAt }];
    savePendingCoach(updated);
    notifyListeners();
  } catch (err) {
    console.warn('[coach] Whisper transcribe failed', err);
    const failed = loadPendingCoach();
    if (failed && !getTranscriptText(failed)) {
      failed.analysisError =
        err instanceof Error
          ? err.message
          : 'Could not transcribe audio. Check OPENAI_API_KEY on AWS and CORS.';
      savePendingCoach(failed);
      notifyListeners();
    }
  }
}

export function getTranscriptText(pending: PendingCoachSession): string {
  return pending.lines.map((l) => l.text).join(' ').trim();
}

/** Runs GPT analysis in the background as soon as the debate ends. */
/** @deprecated Use analysis flow via startCoachAnalysis — kept for hot-reload compatibility */
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
    if (pending.analysisStatus === 'error' && !getTranscriptText(pending)) return;
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
        await ensureTranscriptFromAudio();
        await startCoachAnalysis();
      })().finally(resolve);
    }, 500);
  });
}

export function startCoachAnalysis(): Promise<void> {
  if (analysisPromise) return analysisPromise;

  analysisPromise = (async () => {
    let pending = loadPendingCoach();
    if (!pending) return;

    if (pending.analysisStatus === 'done') {
      return;
    }

    let transcript = getTranscriptText(pending);
    if (!transcript) {
      await ensureTranscriptFromAudio();
      transcript = getTranscriptText(loadPendingCoach() ?? pending);
    }

    if (!transcript) {
      pending.analysisStatus = 'error';
      pending.analysisError =
        'No speech was captured. Allow the microphone, speak during the debate (unmuted), then tap Retry. Coaching uses your mic recording via Whisper.';
      savePendingCoach(pending);
      notifyListeners();
      return;
    }

    pending = loadPendingCoach() ?? pending;
    pending.analysisStatus = 'running';
    pending.analysisError = undefined;
    savePendingCoach(pending);
    notifyListeners();

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
