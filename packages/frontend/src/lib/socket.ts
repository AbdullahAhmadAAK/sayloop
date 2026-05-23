import { io, type Socket } from 'socket.io-client';

function resolveSocketUrl(): string {
  const socketUrl = import.meta.env.VITE_SOCKET_URL?.trim();
  if (socketUrl && !socketUrl.includes('replit.dev')) {
    return socketUrl.replace(/\/$/, '');
  }
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  if (apiUrl && !apiUrl.includes('replit.dev')) {
    return apiUrl.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  return window.location.origin;
}

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

  socket = io(resolveSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function emitPageJoin(page: string) {
  socket?.emit('page:join', { page });
}

export function emitPageLeave(page: string) {
  socket?.emit('page:leave', { page });
}
