import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { normalizeTopicId, type TopicId } from '@/constants/topics';
import {
  connectSocket,
  disconnectSocket,
  emitPageJoin,
  getSocket,
  setSocketTokenGetter,
} from '@/lib/socket';
import { subscribeUserSynced } from '@/lib/authSync';
import { getDbUserId } from '@/hooks/useAuthInit';
import { setTokenGetter } from '@/lib/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import type { AppDispatch } from '@/redux/store';
import {
  addIncomingRequest,
  matchAccepted,
  matchConfirmed,
  removeRequest,
  sendRequestSuccess,
  setNotification,
  resetMatchFlow,
  setPartnerReady,
  setSocketConnected,
  setToast,
} from '@/redux/slice/matchSlice';
import type { PartnerUser } from '@/types';
import {
  endSession,
  initSession,
  sessionStarted,
  setDrawOfferIncoming,
  setDrawOfferPending,
  setSessionWrapping,
  setTimer,
  setWaitingForPartner,
} from '@/redux/slice/sessionSlice';
import { setXpFromServer } from '@/redux/slice/economySlice';
import {
  captureDebateAudioBlob,
  finalizeCoachSession,
  initCoachSession,
  loadPendingCoach,
} from '@/lib/sessionTranscript';
import type { DebateOutcome } from '@/types';
import type { MatchRequest } from '@/types';

import { socketAcceptMatch, socketRejectMatch } from '@/lib/matchApi';

export { socketAcceptMatch, socketRejectMatch };

function socketEmit<T>(
  event: string,
  payload: unknown,
  timeoutMs = 7000,
): Promise<T & { ok: boolean; message?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s?.connected) {
      resolve({ ok: false, message: 'Not connected' } as T & { ok: boolean; message?: string });
      return;
    }
    s.timeout(timeoutMs).emit(event, payload, (err: Error | null, response: T) => {
      if (err) {
        resolve({ ok: false, message: err.message } as T & { ok: boolean; message?: string });
        return;
      }
      resolve((response ?? { ok: false, message: 'No response' }) as T & {
        ok: boolean;
        message?: string;
      });
    });
  });
}

export function socketConfirmReady(matchId: string) {
  return socketEmit<{ ok: boolean; bothReady?: boolean; sessionId?: string | null }>(
    'match:confirm-ready',
    { matchId },
  );
}

function bindSocketListeners(
  s: NonNullable<ReturnType<typeof getSocket>>,
  dispatch: AppDispatch,
  navigate: ReturnType<typeof useNavigate>,
  getPage: () => string,
) {
  const onConnect = () => {
    dispatch(setSocketConnected(true));
    emitPageJoin(getPage());
  };

  const onDisconnect = () => {
    dispatch(setSocketConnected(false));
  };

  const onRequestReceived = (payload: { request: MatchRequest }) => {
    dispatch(addIncomingRequest(payload.request));
    dispatch(setNotification({ request: payload.request }));
  };

  const onRequestSent = (payload: {
    matchId: string;
    partner: PartnerUser;
    topic: TopicId;
  }) => {
    dispatch(sendRequestSuccess({ partner: payload.partner, matchId: payload.matchId }));
  };

  const onAccepted = (payload: {
    matchId: string;
    sessionId: string;
    partner: MatchRequest['requester'];
    topic: TopicId;
  }) => {
    dispatch(
      matchAccepted({
        partner: payload.partner,
        sessionId: payload.sessionId,
        matchId: payload.matchId,
      }),
    );
    dispatch(setToast(`${payload.partner.nickname} accepted your challenge!`));
  };

  const onRejected = () => {
    dispatch(setToast('They declined your challenge'));
    dispatch(resetMatchFlow());
  };

  const onPartnerReady = () => {
    dispatch(setPartnerReady(true));
  };

  const onSessionStart = (payload: {
    sessionId: string;
    partner?: MatchRequest['requester'];
    topic?: string;
  }) => {
    if (!payload.sessionId) return;
    dispatch(matchConfirmed());
    const topic = normalizeTopicId(payload.topic ?? 'social_media');
    initCoachSession({
      sessionId: payload.sessionId,
      topic,
      partnerName: payload.partner?.nickname ?? 'Partner',
    });
    dispatch(
      initSession({
        sessionId: payload.sessionId,
        partnerName: payload.partner?.nickname ?? 'Partner',
        topic,
      }),
    );
    navigate('/session', { state: { sessionId: payload.sessionId }, replace: true });
  };

  const onDebateStart = (payload: {
    durationSeconds: number;
    remainingSeconds?: number;
    topic?: string;
    shouldOffer: boolean;
  }) => {
    dispatch(
      sessionStarted({
        durationSeconds: payload.durationSeconds,
        remainingSeconds: payload.remainingSeconds ?? payload.durationSeconds,
        topic: payload.topic,
        shouldOffer: payload.shouldOffer,
      }),
    );
  };

  const onTimer = (payload: { remainingSeconds: number }) => {
    dispatch(setTimer(payload.remainingSeconds));
    if (payload.remainingSeconds <= 0) {
      void captureDebateAudioBlob();
    }
  };

  let sessionEndHandled = false;

  const onWrapping = () => {
    dispatch(setSessionWrapping());
    void captureDebateAudioBlob();
  };

  const onSessionEnd = (payload: {
    outcome: DebateOutcome;
    xpEarned: number;
    partnerName?: string;
    topic?: string;
    sessionId?: string;
  }) => {
    if (sessionEndHandled) return;
    sessionEndHandled = true;

    const sid = payload.sessionId ?? loadPendingCoach()?.sessionId;

    const finishUi = () => {
      dispatch(
        endSession({
          outcome: payload.outcome,
          xpEarned: payload.xpEarned,
          partnerName: payload.partnerName,
          topic: payload.topic,
        }),
      );
      navigate('/session', {
        replace: true,
        state: { sessionId: sid, endedAt: Date.now() },
      });
    };

    finishUi();

    void (async () => {
      if (!sid) return;
      let pending = loadPendingCoach();
      if (!pending) {
        initCoachSession({
          sessionId: sid,
          topic: normalizeTopicId(payload.topic ?? 'social_media'),
          partnerName: payload.partnerName ?? 'Partner',
        });
        pending = loadPendingCoach();
      }
      await captureDebateAudioBlob();
      const duration =
        pending && pending.startedAt
          ? Math.max(1, Math.round((Date.now() - pending.startedAt) / 1000))
          : 60;
      finalizeCoachSession(sid, duration);
    })();
  };

  const onEconomy = (payload: { xp: number; xpDelta: number }) => {
    dispatch(setXpFromServer({ xp: payload.xp, xpDelta: payload.xpDelta }));
  };

  const onSessionJoined = (payload: { waitingForPartner?: boolean }) => {
    dispatch(setWaitingForPartner(Boolean(payload.waitingForPartner)));
  };

  const onPartnerJoined = () => {
    dispatch(setWaitingForPartner(false));
  };

  const onDrawOffered = () => {
    dispatch(setDrawOfferIncoming(true));
  };

  const onDrawDeclined = () => {
    dispatch(setDrawOfferPending(false));
    dispatch(setToast('Partner declined the draw'));
  };

  const onConnectError = (err: Error) => {
    dispatch(setSocketConnected(false));
    const msg = err.message?.includes('not synced')
      ? 'Finish sign-in — linking your account to the server…'
      : 'Cannot connect live. Start the backend (port 4000) and refresh.';
    dispatch(setToast(msg));
  };

  s.on('connect', onConnect);
  s.on('disconnect', onDisconnect);
  s.on('match:request-received', onRequestReceived);
  s.on('match:request-sent', onRequestSent);
  s.on('match:accepted', onAccepted);
  s.on('match:rejected', onRejected);
  s.on('match:partner-ready', onPartnerReady);
  s.on('match:session-start', onSessionStart);
  s.on('session:start', onDebateStart);
  s.on('session:timer', onTimer);
  s.on('session:wrapping', onWrapping);
  s.on('session:end', onSessionEnd);
  s.on('economy:update', onEconomy);
  s.on('session:joined', onSessionJoined);
  s.on('session:partner-joined', onPartnerJoined);
  s.on('session:draw-offered', onDrawOffered);
  s.on('session:draw-declined', onDrawDeclined);
  s.on('connect_error', onConnectError);

  return () => {
    s.off('connect', onConnect);
    s.off('disconnect', onDisconnect);
    s.off('match:request-received', onRequestReceived);
    s.off('match:request-sent', onRequestSent);
    s.off('match:accepted', onAccepted);
    s.off('match:rejected', onRejected);
    s.off('match:partner-ready', onPartnerReady);
    s.off('match:session-start', onSessionStart);
    s.off('session:start', onDebateStart);
    s.off('session:timer', onTimer);
    s.off('session:wrapping', onWrapping);
    s.off('session:end', onSessionEnd);
    s.off('economy:update', onEconomy);
    s.off('session:joined', onSessionJoined);
    s.off('session:partner-joined', onPartnerJoined);
    s.off('session:draw-offered', onDrawOffered);
    s.off('session:draw-declined', onDrawDeclined);
    s.off('connect_error', onConnectError);
  };
}

export function useMatchSocket() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  const unbindRef = useRef<(() => void) | null>(null);

  pathRef.current = location.pathname;

  useEffect(() => {
    setTokenGetter(() => getToken());
    setSocketTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      unbindRef.current?.();
      unbindRef.current = null;
      disconnectSocket();
      dispatch(setSocketConnected(false));
      return;
    }

    let cancelled = false;

    const connectLive = async () => {
      if (cancelled || !getDbUserId()) return;

      try {
        const s = await connectSocket();
        if (cancelled) return;

        unbindRef.current?.();
        unbindRef.current = bindSocketListeners(
          s,
          dispatch,
          navigate,
          () => pathRef.current,
        );

        if (s.connected) {
          dispatch(setSocketConnected(true));
          emitPageJoin(pathRef.current);
        }
      } catch (err) {
        console.warn('[socket] failed to connect', err);
        dispatch(setSocketConnected(false));
      }
    };

    void connectLive();
    const unsubSync = subscribeUserSynced(() => {
      void connectLive();
    });

    return () => {
      cancelled = true;
      unsubSync();
      unbindRef.current?.();
      unbindRef.current = null;
    };
  }, [isLoaded, isSignedIn, dispatch, navigate, location.pathname]);

  useEffect(() => {
    if (!isSignedIn) return;
    const s = getSocket();
    if (s?.connected) emitPageJoin(location.pathname);
  }, [location.pathname, isSignedIn]);
}
