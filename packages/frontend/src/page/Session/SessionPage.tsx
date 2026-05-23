import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PageShell from '@/components/layout/PageShell';
import MatchmakingScreen from '@/components/modules/sessions/MatchmakingScreen';
import SessionScreen from '@/components/modules/sessions/SessionScreen';
import ResultScreen from '@/components/modules/sessions/ResultScreen';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { useSessionRoom } from '@/hooks/useSessionRoom';
import { leaveDebateSession } from '@/lib/sessionApi';
import { resetSession } from '@/redux/slice/sessionSlice';
import { resetMatchFlow } from '@/redux/slice/matchSlice';

export default function SessionPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { phase, result, sessionId } = useAppSelector((s) => s.session);
  const stateSessionId = (location.state as { sessionId?: string } | null)?.sessionId;

  const activeSessionId = sessionId || stateSessionId;
  const { tryJoin } = useSessionRoom();

  useEffect(() => {
    const sid = activeSessionId;
    return () => {
      if (sid) leaveDebateSession(sid);
      dispatch(resetSession());
      dispatch(resetMatchFlow());
    };
  }, [activeSessionId, dispatch]);

  if (!activeSessionId && phase !== 'ended') {
    return <Navigate to="/match" replace />;
  }

  if (phase === 'ended' && result) {
    return (
      <PageShell title="Results" hideRight>
        <ResultScreen result={result} />
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
