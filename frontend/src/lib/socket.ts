import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

let socket: Socket | null = null;

export const initializeSocket = (userId: number, username: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      socket?.emit('authenticate', { userId, username });
    });

    socket.on('disconnect', () => {
      console.log('📴 Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
