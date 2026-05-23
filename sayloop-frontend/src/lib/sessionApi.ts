import { getSocket, connectSocket } from '@/lib/socket';

export type JoinSessionAck = {
  ok: boolean;
  message?: string;
  partnerJoined?: boolean;
  bothJoined?: boolean;
  debateStarted?: boolean;
  remainingSeconds?: number;
  shouldOffer?: boolean;
  topic?: string;
};

export async function joinDebateSession(sessionId: string): Promise<JoinSessionAck> {
  const s = getSocket()?.connected ? getSocket()! : await connectSocket();

  return new Promise((resolve) => {
    s.timeout(10000).emit('session:join', { sessionId }, (err: Error | null, res: JoinSessionAck) => {
      if (err) {
        resolve({ ok: false, message: err.message });
        return;
      }
      resolve(res ?? { ok: false, message: 'No response from server' });
    });
  });
}

export function leaveDebateSession(sessionId: string) {
  getSocket()?.emit('session:leave', { sessionId });
}

/** Tell server the 1-minute timer finished (needed when client countdown ends first). */
export async function completeDebateSession(
  sessionId: string,
): Promise<{ ok: boolean; alreadyEnded?: boolean; message?: string }> {
  const s = getSocket();
  if (!s?.connected) {
    return { ok: false, message: 'Not connected' };
  }

  return new Promise((resolve) => {
    s.timeout(20000).emit(
      'session:time-up',
      { sessionId },
      (err: Error | null, res: { ok: boolean; alreadyEnded?: boolean; message?: string }) => {
        if (err) {
          resolve({ ok: false, message: err.message });
          return;
        }
        resolve(res ?? { ok: false, message: 'No response from server' });
      },
    );
  });
}
