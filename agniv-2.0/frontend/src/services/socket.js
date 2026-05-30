import { io } from 'socket.io-client';

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
}

export default createSocket;
