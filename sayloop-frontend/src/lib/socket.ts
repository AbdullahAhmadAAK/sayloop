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
    // Polling first is more reliable in dev (Vite WS proxy) and behind some proxies in prod.
    transports: ['polling', 'websocket'] as ('websocket' | 'polling')[],
    reconnection: true,
    reconnectionAttempts: 15,
    reconnectionDelay: 800,
    timeout: 20000,
    withCredentials: true,
  };

  if (connect.mode === 'proxy') {
    socket = io({
      path: '/socket.io',
      ...common,
    });
    if (import.meta.env.DEV) {
      console.info('[socket] dev proxy → ws://localhost:5173/socket.io (backend must run on :4000)');
    }
  } else {
    socket = io(connect.url, common);
    if (import.meta.env.DEV) {
      console.info('[socket] direct →', connect.url);
    }
  }

  return socket;
}

export function emitPageJoin(page: string) {
  socket?.emit('page:join', { page });
}

export function emitPageLeave(page: string) {
  socket?.emit('page:leave', { page });
}
