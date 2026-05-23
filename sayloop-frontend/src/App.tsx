import AppRoutes from '@/components/routes/routes';
import { useClerkApi } from '@/hooks/useClerkApi';
import AuthInit from '@/components/auth/AuthInit';
import GlobalMatchWatcher from '@/components/modules/match/GlobalMatchWatcher';
import MatchToast from '@/components/modules/match/MatchToast';
import MatchFoundModal from '@/components/modules/match/MatchFoundModal';
import LevelUpModal from '@/components/modules/gamification/LevelUpModal';
import { useMatchSocket, socketConfirmReady } from '@/hooks/useMatchSocket';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setMyReady, setToast } from '@/redux/slice/matchSlice';
import { useState } from 'react';

function GlobalMatchModal() {
  const dispatch = useAppDispatch();
  const match = useAppSelector((s) => s.match);
  const [confirming, setConfirming] = useState(false);

  if (match.mode !== 'matched' || !match.activePartner || !match.matchId) return null;

  const handleConfirm = async () => {
    if (!match.matchId || match.myReady) return;
    setConfirming(true);
    try {
      const res = await socketConfirmReady(match.matchId);
      if (!res.ok) {
        dispatch(setToast(res.message || 'Could not confirm ready'));
        return;
      }
      dispatch(setMyReady(true));
      if (res.bothReady) {
        dispatch(setToast('Both ready — opening debate room…'));
      } else {
        dispatch(
          setToast("You're ready! Waiting for your partner to tap Let's go!"),
        );
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
      myReady={match.myReady}
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
