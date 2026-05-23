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
import { leaveDebateSession } from '@/lib/sessionApi';
import { resetSession, tickTimer } from '@/redux/slice/sessionSlice';
import { resetMatchFlow } from '@/redux/slice/matchSlice';
import { clearPendingCoach, ensureCoachAnalysisStarted } from '@/lib/sessionTranscript';
import { useSpeechCapture } from '@/hooks/useSpeechCapture';

type PostGameView = 'summary' | 'review';

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { phase, result, sessionId, topic } = useAppSelector((s) => s.session);
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

  if (phase === 'wrapping') {
    return (
      <PageShell title="Live debate" hideRight>
        <WrappingScreen />
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
