import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { joinDebateSession } from '@/lib/sessionApi';
import { getSocket } from '@/lib/socket';
import {
  sessionStarted,
  setDrawOfferIncoming,
  setDrawOfferPending,
  setWaitingForPartner,
} from '@/redux/slice/sessionSlice';
import { setToast } from '@/redux/slice/matchSlice';

function emitSession<T extends { ok: boolean; message?: string }>(
  event: string,
  payload: unknown,
): Promise<T> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s?.connected) {
      resolve({ ok: false, message: 'Not connected' } as T);
      return;
    }
    s.timeout(8000).emit(event, payload, (err: Error | null, res: T) => {
      if (err) resolve({ ok: false, message: err.message } as T);
      else resolve(res ?? ({ ok: false, message: 'No response' } as T));
    });
  });
}

export function useSessionRoom() {
  const dispatch = useAppDispatch();
  const { sessionId, phase } = useAppSelector((s) => s.session);

  const tryJoin = useCallback(async () => {
    if (!sessionId || phase !== 'joining') return;

    const res = await joinDebateSession(sessionId);
    if (!res.ok) {
      dispatch(setToast(res.message || 'Could not join debate room'));
      return;
    }

    dispatch(setWaitingForPartner(!res.bothJoined));

    if (res.debateStarted) {
      dispatch(
        sessionStarted({
          remainingSeconds: res.remainingSeconds,
          durationSeconds: res.remainingSeconds,
          topic: res.topic,
          shouldOffer: Boolean(res.shouldOffer),
        }),
      );
    }
  }, [sessionId, phase, dispatch]);

  useEffect(() => {
    if (!sessionId || phase !== 'joining') return;

    tryJoin();
    const retry = setInterval(tryJoin, 4000);
    return () => clearInterval(retry);
  }, [sessionId, phase, tryJoin]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !sessionId) return;

    const onDrawOffered = (payload: { sessionId?: string }) => {
      if (payload?.sessionId && payload.sessionId !== sessionId) return;
      dispatch(setDrawOfferIncoming(true));
    };

    const onDrawDeclined = (payload: { sessionId?: string }) => {
      if (payload?.sessionId && payload.sessionId !== sessionId) return;
      dispatch(setDrawOfferPending(false));
      dispatch(setToast('Partner declined the draw'));
    };

    s.on('session:draw-offered', onDrawOffered);
    s.on('session:draw-declined', onDrawDeclined);

    return () => {
      s.off('session:draw-offered', onDrawOffered);
      s.off('session:draw-declined', onDrawDeclined);
    };
  }, [sessionId, dispatch]);

  const offerDraw = async () => {
    if (!sessionId || phase !== 'active') {
      dispatch(setToast('Join the debate room first'));
      return;
    }
    dispatch(setDrawOfferPending(true));
    const res = await emitSession('session:offer-draw', { sessionId });
    if (!res.ok) {
      dispatch(setDrawOfferPending(false));
      dispatch(setToast(res.message || 'Could not offer draw'));
    }
  };

  const acceptDraw = async () => {
    if (!sessionId || phase !== 'active') return;
    const res = await emitSession('session:accept-draw', { sessionId });
    dispatch(setDrawOfferIncoming(false));
    dispatch(setDrawOfferPending(false));
    if (!res.ok) {
      dispatch(setToast(res.message || 'Could not accept draw'));
    }
  };

  const declineDraw = () => {
    if (!sessionId) return;
    getSocket()?.emit('session:decline-draw', { sessionId });
    dispatch(setDrawOfferIncoming(false));
  };

  const resign = async () => {
    if (!sessionId || phase !== 'active') {
      dispatch(setToast('Join the debate room first'));
      return;
    }
    const res = await emitSession('session:resign', { sessionId });
    if (!res.ok) dispatch(setToast(res.message || 'Could not resign'));
  };

  return { offerDraw, acceptDraw, declineDraw, resign, tryJoin };
}
