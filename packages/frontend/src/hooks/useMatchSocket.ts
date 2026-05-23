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
import { setTokenGetter } from '@/lib/api';
import { useAppDispatch } from '@/hooks/useAppDispatch';
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
  setTimer,
  setWaitingForPartner,
} from '@/redux/slice/sessionSlice';
import { setXpFromServer } from '@/redux/slice/economySlice';
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

export function useMatchSocket() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const listenersBoundRef = useRef(false);
  const socketRef = useRef<ReturnType<typeof getSocket>>(null);

  useEffect(() => {
    setTokenGetter(() => getToken());
    setSocketTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      disconnectSocket();
      listenersBoundRef.current = false;
      socketRef.current = null;
      dispatch(setSocketConnected(false));
      return;
    }

    let cancelled = false;

    const bindListeners = (s: NonNullable<ReturnType<typeof getSocket>>) => {
      if (listenersBoundRef.current) return;
      listenersBoundRef.current = true;

      s.on('connect', () => {
        dispatch(setSocketConnected(true));
        emitPageJoin(location.pathname);
      });

      s.on('disconnect', () => {
        dispatch(setSocketConnected(false));
      });

      s.on('match:request-received', (payload: { request: MatchRequest }) => {
        dispatch(addIncomingRequest(payload.request));
        dispatch(setNotification({ request: payload.request }));
      });

      s.on(
        'match:request-sent',
        (payload: {
          matchId: string;
          partner: PartnerUser;
          topic: TopicId;
        }) => {
          dispatch(
            sendRequestSuccess({ partner: payload.partner, matchId: payload.matchId }),
          );
        },
      );

      s.on(
        'match:accepted',
        (payload: {
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
        },
      );

      s.on('match:rejected', () => {
        dispatch(setToast('They declined your challenge'));
        dispatch(resetMatchFlow());
      });

      s.on('match:partner-ready', () => {
        dispatch(setPartnerReady(true));
      });

      s.on(
        'match:session-start',
        (payload: {
          sessionId: string;
          partner: MatchRequest['requester'];
          topic: TopicId;
        }) => {
          dispatch(matchConfirmed());
          dispatch(
            initSession({
              sessionId: payload.sessionId,
              partnerName: payload.partner.nickname,
              topic: normalizeTopicId(payload.topic),
            }),
          );
          navigate('/session', { state: { sessionId: payload.sessionId } });
        },
      );

      s.on(
        'session:start',
        (payload: {
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
        },
      );

      s.on('session:timer', (payload: { remainingSeconds: number }) => {
        dispatch(setTimer(payload.remainingSeconds));
      });

      s.on(
        'session:end',
        (payload: {
          outcome: DebateOutcome;
          xpEarned: number;
          partnerName?: string;
          topic?: string;
        }) => {
          dispatch(
            endSession({
              outcome: payload.outcome,
              xpEarned: payload.xpEarned,
              partnerName: payload.partnerName,
              topic: payload.topic,
            }),
          );
        },
      );

      s.on('economy:update', (payload: { xp: number; xpDelta: number }) => {
        dispatch(setXpFromServer({ xp: payload.xp, xpDelta: payload.xpDelta }));
      });

      s.on('session:joined', (payload: { waitingForPartner?: boolean }) => {
        dispatch(setWaitingForPartner(Boolean(payload.waitingForPartner)));
      });

      s.on('session:partner-joined', () => {
        dispatch(setWaitingForPartner(false));
      });

      s.on('session:draw-offered', () => {
        dispatch(setDrawOfferIncoming(true));
      });

      s.on('session:draw-declined', () => {
        dispatch(setDrawOfferPending(false));
        dispatch(setToast('Partner declined the draw'));
      });

      s.on('connect_error', (err) => {
        dispatch(setSocketConnected(false));
        const msg = err.message?.includes('not synced')
          ? 'Sign in again — your account is not linked to the server yet.'
          : 'Cannot connect live. Start the backend (port 4000) and refresh.';
        dispatch(setToast(msg));
      });
    };

    (async () => {
      try {
        const s = await connectSocket();
        if (cancelled) return;
        socketRef.current = s;
        bindListeners(s);
        if (s.connected) {
          dispatch(setSocketConnected(true));
          emitPageJoin(location.pathname);
        }
      } catch (err) {
        console.warn('[socket] failed to connect', err);
        dispatch(setSocketConnected(false));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, dispatch, navigate, location.pathname]);

  useEffect(() => {
    if (!isSignedIn) return;
    const s = getSocket();
    if (s?.connected) emitPageJoin(location.pathname);
  }, [location.pathname, isSignedIn]);
}
