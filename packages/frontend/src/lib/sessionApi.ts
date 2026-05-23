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
