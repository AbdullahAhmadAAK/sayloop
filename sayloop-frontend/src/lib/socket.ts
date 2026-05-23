import { io, type Socket } from 'socket.io-client';
import { resolveSocketConnect } from '@/lib/env';

let socket: Socket | null = null;
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setSocketTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const token = tokenGetter ? await tokenGetter() : null;
  const connect = resolveSocketConnect();

  const common = {
    auth: { token },
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    reconnection: true,
    reconnectionAttempts: 10,
    withCredentials: true,
  };

  if (connect.mode === 'proxy') {
    socket = io({
      path: '/socket.io',
      ...common,
    });
  } else {
    socket = io(connect.url, common);
  }

  return socket;
}

export function emitPageJoin(page: string) {
  socket?.emit('page:join', { page });
}

export function emitPageLeave(page: string) {
  socket?.emit('page:leave', { page });
}
