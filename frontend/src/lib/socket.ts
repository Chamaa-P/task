import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let authenticatedUser: { userId: number; username: string } | null = null;

const getSocketUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return window.location.origin;
};

const authenticateSocket = (): void => {
  if (socket?.connected && authenticatedUser) {
    socket.emit('authenticate', authenticatedUser);
  }
};

export const initializeSocket = (userId: number, username: string): Socket => {
  authenticatedUser = { userId, username };

  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      authenticateSocket();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  authenticateSocket();

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

  authenticatedUser = null;
};
