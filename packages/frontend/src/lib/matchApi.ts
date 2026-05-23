import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import type { MatchRequest, PartnerUser } from '@/types';
import type { TopicId } from '@/constants/topics';
import { matchAccepted, removeRequest, sendRequestSuccess, setNotification } from '@/redux/slice/matchSlice';
import type { AppDispatch } from '@/redux/store';

export async function fetchOnlineUsers(): Promise<PartnerUser[]> {
  const { data } = await api.get<{ success: boolean; users: PartnerUser[] }>('/users/browse');
  return data.users;
}

export async function fetchPendingRequests(): Promise<MatchRequest[]> {
  const { data } = await api.get<{ success: boolean; requests: MatchRequest[] }>(
    '/matches/pending',
  );
  return data.requests;
}

export async function sendMatchRequestRest(partnerId: string, topic: TopicId) {
  const { data } = await api.post<{
    success: boolean;
    matchId: string;
    partner: PartnerUser;
    topic: TopicId;
  }>('/matches', { partnerId: Number(partnerId), topic });
  return data;
}

/** Try socket when connected, always fall back to REST API. */
export async function sendMatchChallenge(
  partner: PartnerUser,
  topic: TopicId,
): Promise<{ ok: boolean; matchId?: string; message?: string }> {
  const s = getSocket();
  let socketResult: { ok: boolean; matchId?: string; message?: string } = {
    ok: false,
    message: 'Socket not connected',
  };

  if (s?.connected) {
    socketResult = await socketSendMatchRequest(partner.id, topic);
    if (socketResult.ok && socketResult.matchId) {
      return socketResult;
    }
  }

  try {
    const data = await sendMatchRequestRest(partner.id, topic);
    return {
      ok: true,
      matchId: data.matchId,
    };
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
    return {
      ok: false,
      message:
        msg ||
        socketResult.message ||
        'Could not send challenge. Start sayloop-backend (npm run dev) and refresh.',
    };
  }
}

export function socketSendMatchRequest(
  toUserId: string,
  topic: TopicId,
): Promise<{
  ok: boolean;
  matchId?: string;
  partner?: PartnerUser;
  topic?: TopicId;
  message?: string;
}> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s?.connected) {
      resolve({ ok: false, message: 'Not connected — wait for the green Live badge' });
      return;
    }

    const payload = { toUserId: Number(toUserId), topic };

    const done = (result: {
      ok: boolean;
      matchId?: string;
      partner?: PartnerUser;
      topic?: TopicId;
      message?: string;
    }) => resolve(result);

    const fallbackTimer = setTimeout(() => {
      done({ ok: false, message: 'Server slow — retrying via API…' });
    }, 8000);

    try {
      s.timeout(7000).emit('match:send-request', payload, (err, response) => {
        clearTimeout(fallbackTimer);
        if (err) {
          done({ ok: false, message: err.message || 'Socket timeout' });
          return;
        }
        if (!response) {
          done({ ok: false, message: 'No response from server' });
          return;
        }
        done(response);
      });
    } catch {
      clearTimeout(fallbackTimer);
      s.emit('match:send-request', payload, (response: { ok: boolean; matchId?: string; message?: string }) => {
        clearTimeout(fallbackTimer);
        done(response ?? { ok: false, message: 'No response' });
      });
    }
  });
}

export function applySendSuccess(
  dispatch: AppDispatch,
  partner: PartnerUser,
  matchId: string,
) {
  dispatch(sendRequestSuccess({ partner, matchId }));
}

export type MatchAcceptedPayload = {
  matchId: string;
  sessionId: string;
  partner: PartnerUser;
  topic: TopicId;
};

export async function fetchMatchState(matchId: string): Promise<MatchAcceptedPayload | null> {
  try {
    const { data } = await api.get<{
      success: boolean;
      matchId: string;
      sessionId: string;
      partner: PartnerUser;
      topic: TopicId;
    }>(`/matches/${matchId}`);
    if (data.success && data.sessionId && data.partner) {
      return {
        matchId: data.matchId,
        sessionId: data.sessionId,
        partner: data.partner,
        topic: data.topic,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function acceptMatchRequest(matchId: string): Promise<MatchAcceptedPayload> {
  const { data } = await api.post<{
    success: boolean;
    matchId: string;
    sessionId: string;
    partner: PartnerUser;
    topic: TopicId;
  }>(`/matches/${matchId}/accept`);
  return {
    matchId: data.matchId,
    sessionId: data.sessionId,
    partner: data.partner,
    topic: data.topic,
  };
}

export function socketAcceptMatch(
  matchId: string,
): Promise<MatchAcceptedPayload & { ok: boolean; message?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s?.connected) {
      resolve({ ok: false, message: 'Not connected — wait for the green Live badge' });
      return;
    }
    s.timeout(10000).emit(
      'match:accept',
      { matchId },
      (
        err: Error | null,
        response: (MatchAcceptedPayload & { ok: boolean; message?: string }) | undefined,
      ) => {
        if (err) {
          resolve({ ok: false, message: err.message || 'Socket timeout' });
          return;
        }
        resolve(response ?? { ok: false, message: 'No response from server' });
      },
    );
  });
}

export function socketRejectMatch(matchId: string): Promise<{ ok: boolean; message?: string }> {
  return new Promise((resolve) => {
    const s = getSocket();
    if (!s?.connected) {
      resolve({ ok: false, message: 'Not connected' });
      return;
    }
    s.timeout(8000).emit('match:reject', { matchId }, (err: Error | null, response?: { ok: boolean }) => {
      if (err) resolve({ ok: false, message: err.message });
      else resolve(response ?? { ok: true });
    });
  });
}

export function applyMatchAccepted(dispatch: AppDispatch, payload: MatchAcceptedPayload) {
  dispatch(
    matchAccepted({
      matchId: payload.matchId,
      sessionId: payload.sessionId,
      partner: payload.partner,
    }),
  );
  dispatch(removeRequest(payload.matchId));
  dispatch(setNotification(null));
}

/** Socket first, REST fallback — always returns partner/session on success. */
export async function acceptMatchChallenge(
  matchId: string,
): Promise<{ ok: boolean; message?: string; payload?: MatchAcceptedPayload }> {
  const socketRes = await socketAcceptMatch(matchId);
  if (socketRes.ok && socketRes.matchId && socketRes.sessionId && socketRes.partner) {
    return {
      ok: true,
      payload: {
        matchId: socketRes.matchId,
        sessionId: socketRes.sessionId,
        partner: socketRes.partner,
        topic: socketRes.topic as TopicId,
      },
    };
  }

  if (socketRes.ok) {
    const fetched = await fetchMatchState(matchId);
    if (fetched) return { ok: true, payload: fetched };
    return { ok: true };
  }

  try {
    const payload = await acceptMatchRequest(matchId);
    return { ok: true, payload };
  } catch (err: unknown) {
    const res =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number; data?: { message?: string } } }).response
        : undefined;
    const msg = res?.data?.message;
    const alreadyHandled =
      res?.status === 404 &&
      typeof msg === 'string' &&
      msg.toLowerCase().includes('already');

    if (alreadyHandled || socketRes.ok) {
      const fetched = await fetchMatchState(matchId);
      if (fetched) return { ok: true, payload: fetched };
      return { ok: true };
    }

    return {
      ok: false,
      message:
        msg || socketRes.message || 'Could not accept. Is the backend running on port 4000?',
    };
  }
}

export async function rejectMatchRequest(matchId: string) {
  await api.post(`/matches/${matchId}/reject`);
}
