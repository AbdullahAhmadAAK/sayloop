import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import PageShell from '@/components/layout/PageShell';
import MatchmakingScreen from '@/components/modules/sessions/MatchmakingScreen';
import SessionScreen from '@/components/modules/sessions/SessionScreen';
import SessionSummaryScreen from '@/components/modules/sessions/SessionSummaryScreen';
import SessionReviewScreen from '@/components/modules/sessions/SessionReviewScreen';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { useSessionRoom } from '@/hooks/useSessionRoom';
import { leaveDebateSession } from '@/lib/sessionApi';
import { resetSession } from '@/redux/slice/sessionSlice';
import { resetMatchFlow } from '@/redux/slice/matchSlice';
import { clearPendingCoach } from '@/lib/sessionTranscript';

type PostGameView = 'summary' | 'review';

export default function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { phase, result, sessionId, topic, timerSeconds } = useAppSelector((s) => s.session);
  const stateSessionId = (location.state as { sessionId?: string } | null)?.sessionId;
  const sessionIdRef = useRef<string | null>(null);
  const [postGameView, setPostGameView] = useState<PostGameView>('summary');

  const activeSessionId = sessionId || stateSessionId || null;
  sessionIdRef.current = activeSessionId;
  const { tryJoin } = useSessionRoom();

  useEffect(() => {
    if (phase === 'ended') {
      setPostGameView('summary');
    }
  }, [phase, result?.outcome]);

  useEffect(() => {
    return () => {
      const sid = sessionIdRef.current;
      if (sid) leaveDebateSession(sid);
    };
  }, []);

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
        <PageShell title="Review" hideRight>
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
      <PageShell title="Game over" hideRight>
        <SessionSummaryScreen
          result={result}
          topic={result.topic ?? topic}
          onReview={() => setPostGameView('review')}
          onLeave={handleLeaveHome}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Live debate" hideRight>
      {phase === 'joining' && <MatchmakingScreen onRetry={tryJoin} />}
      {phase === 'active' && <SessionScreen />}
    </PageShell>
  );
}
