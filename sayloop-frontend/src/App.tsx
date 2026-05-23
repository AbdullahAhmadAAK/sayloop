import AppRoutes from '@/components/routes/routes';
import { useClerkApi } from '@/hooks/useClerkApi';
import AuthInit from '@/components/auth/AuthInit';
import GlobalMatchWatcher from '@/components/modules/match/GlobalMatchWatcher';
import MatchToast from '@/components/modules/match/MatchToast';
import MatchFoundModal from '@/components/modules/match/MatchFoundModal';
import LevelUpModal from '@/components/modules/gamification/LevelUpModal';
import { useMatchSocket, socketConfirmReady } from '@/hooks/useMatchSocket';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { matchConfirmed } from '@/redux/slice/matchSlice';
import { initSession } from '@/redux/slice/sessionSlice';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GlobalMatchModal() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const match = useAppSelector((s) => s.match);
  const [confirming, setConfirming] = useState(false);

  if (match.mode !== 'matched' || !match.activePartner || !match.matchId) return null;

  const handleConfirm = async () => {
    if (!match.matchId) return;
    setConfirming(true);
    try {
      const res = await socketConfirmReady(match.matchId);
      if (res.ok && res.bothReady && res.sessionId) {
        dispatch(matchConfirmed());
        dispatch(
          initSession({
            sessionId: res.sessionId,
            partnerName: match.activePartner!.nickname,
            topic: match.selectedTopic,
          }),
        );
        navigate('/session', { state: { sessionId: res.sessionId } });
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <MatchFoundModal
      open
      partner={match.activePartner}
      partnerReady={match.partnerReady}
      loading={confirming}
      onConfirm={handleConfirm}
    />
  );
}

export default function App() {
  useClerkApi();
  useMatchSocket();

  return (
    <>
      <AuthInit />
      <AppRoutes />
      <GlobalMatchWatcher />
      <MatchToast />
      <GlobalMatchModal />
      <LevelUpModal />
    </>
  );
}
