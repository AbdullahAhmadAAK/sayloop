import { useEffect, useState } from 'react';
import type { SessionResult } from '@/types';
import type { TopicId } from '@/constants/topics';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getTopic } from '@/constants/topics';
import {
  loadPendingCoach,
  subscribeCoachSession,
  type AnalysisStatus,
} from '@/lib/sessionTranscript';

type Props = {
  result: SessionResult;
  topic?: TopicId;
  onReview: () => void;
  onLeave: () => void;
};

function headline(outcome: SessionResult['outcome']) {
  switch (outcome) {
    case 'WIN':
      return { emoji: '🏆', title: 'You won!' };
    case 'LOSS':
      return { emoji: '💪', title: 'Good effort' };
    case 'DRAW':
      return { emoji: '🤝', title: 'Draw agreed' };
    case 'COMPLETE':
      return { emoji: '🎉', title: 'Session complete!' };
    default:
      return { emoji: '✨', title: 'Debate finished' };
  }
}

function analysisHint(status: AnalysisStatus | undefined) {
  switch (status) {
    case 'running':
    case 'idle':
      return {
        text: 'Analyzing your speaking in the background…',
        ready: false,
      };
    case 'done':
      return {
        text: 'Your stats and coach notes are ready.',
        ready: true,
      };
    case 'error':
      return {
        text: 'Analysis could not run — you can still open review for details.',
        ready: true,
      };
    default:
      return { text: null, ready: true };
  }
}

/** Chess-style post-game screen: review or leave. */
export default function SessionSummaryScreen({ result, topic: topicProp, onReview, onLeave }: Props) {
  const topic = getTopic(result.topic ?? topicProp);
  const { emoji, title } = headline(result.outcome);
  const xpPositive = result.xpEarned >= 0;

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | undefined>(
    () => loadPendingCoach()?.analysisStatus,
  );

  useEffect(() => {
    return subscribeCoachSession((pending) => {
      setAnalysisStatus(pending?.analysisStatus);
    });
  }, []);

  const hint = analysisHint(analysisStatus);
  const isAnalyzing = analysisStatus === 'running' || analysisStatus === 'idle';

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center animate-fade-in-up">
      <span className="text-6xl">{emoji}</span>
      <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 text-ink/60">vs {result.partnerName}</p>

      <p
        className={`mt-6 text-4xl font-extrabold ${
          xpPositive ? 'text-brand' : 'text-red-600'
        }`}
      >
        {xpPositive ? '+' : ''}
        {result.xpEarned} XP
      </p>

      <div className="mt-6 w-full rounded-2xl bg-white p-4 text-left shadow-sm">
        <Badge tone="neutral">
          {topic?.emoji} {topic?.label}
        </Badge>
        <p className="mt-3 text-sm text-ink/70">{topic?.prompt}</p>
      </div>

      {hint.text && (
        <div
          className={`mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm ${
            hint.ready ? 'bg-brand/10 text-ink/70' : 'bg-cream text-ink/60'
          }`}
        >
          {isAnalyzing && (
            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          )}
          <span>{hint.text}</span>
        </div>
      )}

      <p className="mt-6 text-sm text-ink/55">
        Review shows your WPM, fillers, and personalized coach notes. Available in this tab until you
        refresh.
      </p>

      <div className="mt-6 flex w-full flex-col gap-3">
        <Button fullWidth size="lg" onClick={onReview}>
          {analysisStatus === 'done' ? 'View review' : 'Review session'}
        </Button>
        <Button variant="secondary" fullWidth size="lg" onClick={onLeave}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
