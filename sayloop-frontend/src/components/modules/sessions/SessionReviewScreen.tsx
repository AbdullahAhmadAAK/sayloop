import { useEffect, useState } from 'react';
import type { SessionResult } from '@/types';
import type { TopicId } from '@/constants/topics';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getTopic } from '@/constants/topics';
import {
  ensureCoachAnalysisStarted,
  loadPendingCoach,
  retryCoachAnalysis,
  subscribeCoachSession,
  type CoachMetrics,
  type PendingCoachSession,
} from '@/lib/sessionTranscript';

type Props = {
  result: SessionResult;
  sessionId?: string | null;
  topic?: TopicId;
  onBack: () => void;
  onLeave: () => void;
};

function applyPending(
  pending: PendingCoachSession | null,
  sessionId: string | null | undefined,
  setters: {
    setPending: (p: PendingCoachSession | null) => void;
    setMetrics: (m: CoachMetrics | null) => void;
    setNarrative: (n: string | null) => void;
    setError: (e: string | null) => void;
    setLoading: (l: boolean) => void;
  },
) {
  if (!pending || (sessionId && pending.sessionId !== sessionId)) {
    setters.setPending(null);
    setters.setError('No session data in this tab. Start a new debate to review again.');
    setters.setLoading(false);
    return;
  }

  setters.setPending(pending);

  if (pending.analysisStatus === 'running' || pending.analysisStatus === 'idle') {
    setters.setLoading(true);
    setters.setError(null);
    setters.setNarrative(null);
    setters.setMetrics(null);
    return;
  }

  if (pending.analysisStatus === 'error') {
    setters.setLoading(false);
    setters.setError(pending.analysisError ?? 'Analysis unavailable.');
    setters.setNarrative(null);
    setters.setMetrics(null);
    return;
  }

  setters.setLoading(false);
  setters.setError(null);
  setters.setNarrative(pending.coachingNarrative ?? null);
  setters.setMetrics(pending.metrics ?? null);
}

export default function SessionReviewScreen({
  result,
  sessionId,
  topic: topicProp,
  onBack,
  onLeave,
}: Props) {
  const topic = getTopic(result.topic ?? topicProp);
  const [pending, setPending] = useState<PendingCoachSession | null>(() => loadPendingCoach());
  const [narrative, setNarrative] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<CoachMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    ensureCoachAnalysisStarted();
    const setters = {
      setPending,
      setMetrics,
      setNarrative,
      setError,
      setLoading,
    };

    return subscribeCoachSession((p) => applyPending(p, sessionId, setters));
  }, [sessionId]);

  const handleRetry = async () => {
    setRetrying(true);
    setLoading(true);
    setError(null);
    try {
      await retryCoachAnalysis();
    } finally {
      setRetrying(false);
    }
  };

  const transcriptPreview = pending
    ? pending.lines
        .map((l) => l.text)
        .join(' ')
        .trim()
        .slice(0, 200)
    : '';

  return (
    <div className="mx-auto max-w-md py-6 animate-fade-in-up">
      <div className="mb-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
          Session review
        </p>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">Your stats</h2>
        <p className="mt-1 text-sm text-ink/55">vs {result.partnerName}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <Badge tone="neutral">
          {topic?.emoji} {topic?.label}
        </Badge>
        <p className="mt-2 text-xs text-ink/50">{topic?.prompt}</p>
      </div>

      {loading && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <p className="text-sm font-semibold text-ink/70">Finishing your analysis…</p>
          <p className="text-xs text-ink/45">Started when the debate ended — almost ready</p>
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
          <p>{error}</p>
          {error.includes('No speech') ? (
            <p className="text-xs text-red-600/80">
              Tip: use Chrome or Edge, allow the microphone, and speak clearly during the debate.
              Your partner&apos;s audio is not recorded — only your side.
            </p>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={retrying}
              onClick={() => void handleRetry()}
            >
              {retrying ? 'Retrying…' : 'Retry analysis'}
            </Button>
          )}
        </div>
      )}

      {!loading && metrics && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-extrabold text-ink">{metrics.wpm}</p>
            <p className="text-[10px] text-ink/45">WPM</p>
            <p className="text-[10px] font-semibold capitalize text-brand">{metrics.wpmLabel}</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-extrabold text-ink">{metrics.wordCount}</p>
            <p className="text-[10px] text-ink/45">Words</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-extrabold text-ink">{metrics.fillerTotal}</p>
            <p className="text-[10px] text-ink/45">Fillers</p>
          </div>
          <div className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-extrabold text-ink">{metrics.durationSeconds}s</p>
            <p className="text-[10px] text-ink/45">Speaking time</p>
          </div>
        </div>
      )}

      {!loading && narrative && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            Coach notes
            {pending?.source === 'openai' && (
              <span className="ml-2 font-normal normal-case text-ink/35">· GPT-4o</span>
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{narrative}</p>
        </div>
      )}

      {!loading && transcriptPreview && (
        <div className="mt-4 rounded-xl bg-cream/80 p-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ink/40">
            What we heard
          </p>
          <p className="mt-1 text-xs italic leading-relaxed text-ink/55">
            &ldquo;{transcriptPreview}
            {transcriptPreview.length >= 200 ? '…' : ''}&rdquo;
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Button variant="secondary" fullWidth onClick={onBack}>
          Back to results
        </Button>
        <Button fullWidth onClick={onLeave}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
