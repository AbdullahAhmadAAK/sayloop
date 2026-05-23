import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import PageShell from '@/components/layout/PageShell';
import MatchmakingScreen from '@/components/modules/sessions/MatchmakingScreen';
import SessionScreen from '@/components/modules/sessions/SessionScreen';
import WrappingScreen from '@/components/modules/sessions/WrappingScreen';
import SessionSummaryScreen from '@/components/modules/sessions/SessionSummaryScreen';
import SessionReviewScreen from '@/components/modules/sessions/SessionReviewScreen';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { useSessionRoom } from '@/hooks/useSessionRoom';
import { completeDebateSession, leaveDebateSession } from '@/lib/sessionApi';
import { resetSession, tickTimer, endSession } from '@/redux/slice/sessionSlice';
import {
  captureDebateAudioBlob,
  finalizeCoachSession,
  loadPendingCoach,
} from '@/lib/sessionTranscript';
import { resetMatchFlow } from '@/redux/slice/matchSlice';
import { clearPendingCoach, ensureCoachAnalysisStarted } from '@/lib/sessionTranscript';
import { useSpeechCapture } from '@/hooks/useSpeechCapture';

type PostGameView = 'summary' | 'review';

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { phase, result, sessionId, topic, partnerName } = useAppSelector((s) => s.session);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const stateSessionId = (location.state as { sessionId?: string; endedAt?: number } | null)
    ?.sessionId;
  const [postGameView, setPostGameView] = useState<PostGameView>('summary');
  const [pageKey, setPageKey] = useState(0);

  const activeSessionId = sessionId || stateSessionId || null;
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = activeSessionId;
  const { tryJoin } = useSessionRoom();

  const captureSpeech =
    Boolean(activeSessionId) &&
    (phase === 'joining' || phase === 'active' || phase === 'wrapping');
  useSpeechCapture(captureSpeech, activeSessionId);

  // 1-minute countdown while debate is active (server session:timer can resync via setTimer).
  useEffect(() => {
    if (phase !== 'active') return;
    const id = window.setInterval(() => dispatch(tickTimer()), 1000);
    return () => window.clearInterval(id);
  }, [phase, dispatch]);

  // After time's up: ask server to finalize + never spin forever if session:end is delayed.
  useEffect(() => {
    if (phase !== 'wrapping' || !activeSessionId) return;

    const sid = activeSessionId;
    void completeDebateSession(sid);

    void (async () => {
      await captureDebateAudioBlob();
      const pending = loadPendingCoach();
      if (pending && String(pending.sessionId) === String(sid) && !pending.endedAt) {
        const duration = pending.startedAt
          ? Math.max(1, Math.round((Date.now() - pending.startedAt) / 1000))
          : 60;
        finalizeCoachSession(sid, duration);
      }
    })();

    const fallbackMs = 8000;
    const timeoutId = window.setTimeout(() => {
      if (phaseRef.current !== 'wrapping') return;
      dispatch(
        endSession({
          outcome: 'COMPLETE',
          xpEarned: 50,
          partnerName: partnerName || 'Partner',
          topic,
        }),
      );
    }, fallbackMs);

    return () => window.clearTimeout(timeoutId);
  }, [phase, activeSessionId, dispatch, partnerName, topic]);

  useEffect(() => {
    if (phase === 'ended') {
      setPostGameView('summary');
      setPageKey((k) => k + 1);
      window.scrollTo(0, 0);
      ensureCoachAnalysisStarted();
    }
  }, [phase, result?.outcome]);

  useEffect(() => {
    return () => {
      const sid = sessionIdRef.current;
      if (sid && phase !== 'ended') leaveDebateSession(sid);
    };
  }, [phase]);

  const handleLeaveHome = () => {
    clearPendingCoach();
    dispatch(resetSession());
    dispatch(resetMatchFlow());
    navigate('/home', { replace: true });
  };

  if (!activeSessionId && phase !== 'ended') {
    return <Navigate to="/match" replace />;
  }

  if (phase === 'ended' && result) {
    if (postGameView === 'review') {
      return (
        <PageShell key={`review-${pageKey}`} title="Review" hideRight>
          <SessionReviewScreen
            result={result}
            sessionId={activeSessionId}
            topic={result.topic ?? topic}
            onBack={() => setPostGameView('summary')}
            onLeave={handleLeaveHome}
          />
        </PageShell>
      );
    }

    return (
      <PageShell key={`summary-${pageKey}`} title="Game over" hideRight>
        <SessionSummaryScreen
          result={result}
          topic={result.topic ?? topic}
          onReview={() => setPostGameView('review')}
          onLeave={handleLeaveHome}
        />
      </PageShell>
    );
  }

  const skipWrapping = () => {
    dispatch(
      endSession({
        outcome: 'COMPLETE',
        xpEarned: 50,
        partnerName: partnerName || 'Partner',
        topic,
      }),
    );
  };

  if (phase === 'wrapping') {
    return (
      <PageShell title="Live debate" hideRight>
        <WrappingScreen onSkip={skipWrapping} />
      </PageShell>
    );
  }

  return (
    <PageShell key={`live-${activeSessionId}`} title="Live debate" hideRight>
      {phase === 'joining' && <MatchmakingScreen onRetry={tryJoin} />}
      {phase === 'active' && <SessionScreen />}
    </PageShell>
  );
}
