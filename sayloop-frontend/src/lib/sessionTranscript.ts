import type { TopicId } from '@/constants/topics';
import { fetchCoachingAnalyze, type CoachingAnalyzeResult } from '@/lib/api';

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
  if (!pending || pending.sessionId !== sessionId) return;
  const line = text.trim();
  if (!line) return;
  pending.lines.push({ text: line, at: Date.now() });
  savePendingCoach(pending);
}

export function initCoachSession(payload: {
  sessionId: string;
  topic: TopicId;
  partnerName: string;
}) {
  analysisPromise = null;
  savePendingCoach({
    sessionId: payload.sessionId,
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

export function finalizeCoachSession(sessionId: string, durationSeconds: number) {
  const pending = loadPendingCoach();
  if (!pending || pending.sessionId !== sessionId) return;
  pending.endedAt = Date.now();
  pending.durationSeconds = durationSeconds;
  savePendingCoach(pending);
  void startCoachAnalysis();
}

export function getTranscriptText(pending: PendingCoachSession): string {
  return pending.lines.map((l) => l.text).join(' ').trim();
}

/** Runs GPT analysis in the background as soon as the debate ends. */
export function startCoachAnalysis(): Promise<void> {
  if (analysisPromise) return analysisPromise;

  analysisPromise = (async () => {
    const pending = loadPendingCoach();
    if (!pending) return;

    if (pending.analysisStatus === 'done' || pending.analysisStatus === 'running') {
      return;
    }

    const transcript = getTranscriptText(pending);
    if (!transcript) {
      pending.analysisStatus = 'error';
      pending.analysisError =
        'No speech was captured. Use Chrome or Edge, allow the mic, and speak during the debate.';
      savePendingCoach(pending);
      notifyListeners();
      return;
    }

    pending.analysisStatus = 'running';
    pending.analysisError = undefined;
    savePendingCoach(pending);
    notifyListeners();

    try {
      const res = await fetchCoachingAnalyze({
        transcript,
        topicId: pending.topic,
        durationSeconds: pending.durationSeconds || 60,
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
    }
  })();

  return analysisPromise;
}

export function clearPendingCoach() {
  analysisPromise = null;
  sessionStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}
