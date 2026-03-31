import { Server, Socket } from 'socket.io';

interface ConnectedUser {
  userId: number;
  username: string;
  socketId: string;
}

interface TaskSocketPayload {
  task?: unknown;
  taskId?: number | string;
  projectId?: number | null;
  actorUserId?: number;
}

interface ProjectSocketPayload {
  projectId?: number | string | null;
  actorUserId?: number;
}

const connectedUsers: Map<string, ConnectedUser> = new Map();
let ioInstance: Server | null = null;

const emitEvent = (eventName: string, payload: unknown): void => {
  if (!ioInstance) {
    console.warn(`WebSocket server not initialized for event: ${eventName}`);
    return;
  }

  ioInstance.emit(eventName, payload);
};

export const initializeWebSocket = (io: Server): void => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('authenticate', (userData: { userId: number; username: string }) => {
      connectedUsers.set(socket.id, {
        userId: userData.userId,
        username: userData.username,
        socketId: socket.id,
      });

      console.log(`User authenticated: ${userData.username} (${socket.id})`);

      io.emit('user:online', {
        userId: userData.userId,
        username: userData.username,
      });

      const onlineUsers = Array.from(connectedUsers.values()).map((user) => ({
        userId: user.userId,
        username: user.username,
      }));
      socket.emit('users:online', onlineUsers);
    });

    socket.on('task:update', (data: TaskSocketPayload) => {
      console.log('Task updated:', data);
      emitTaskUpdated(data);
    });

    socket.on('task:create', (data: TaskSocketPayload) => {
      console.log('Task created:', data);
      emitTaskCreated(data);
    });

    socket.on('task:delete', (data: TaskSocketPayload) => {
      console.log('Task deleted:', data);
      emitTaskDeleted(data);
    });

    socket.on('project:update', (data: unknown) => {
      console.log('Project updated:', data);
      io.emit('project:updated', data);
    });

    socket.on('typing:start', (data: { userId: number; username: string; taskId: number }) => {
      socket.broadcast.emit('user:typing', data);
    });

    socket.on('typing:stop', (data: { userId: number; taskId: number }) => {
      socket.broadcast.emit('user:stopped_typing', data);
    });

    socket.on('notification:send', (data: any) => {
      if (data.targetUserId) {
        const targetUser = Array.from(connectedUsers.values()).find(
          (user) => user.userId === data.targetUserId
        );
        if (targetUser) {
          io.to(targetUser.socketId).emit('notification:received', data);
        }
      } else {
        io.emit('notification:received', data);
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`User disconnected: ${user.username} (${socket.id})`);
        connectedUsers.delete(socket.id);

        io.emit('user:offline', {
          userId: user.userId,
          username: user.username,
        });
      } else {
        console.log(`Unknown user disconnected: ${socket.id}`);
      }
    });
  });

  console.log('WebSocket handlers initialized');
};

export const getConnectedUsers = (): ConnectedUser[] => {
  return Array.from(connectedUsers.values());
};

export const emitTaskCreated = (payload: TaskSocketPayload): void => {
  emitEvent('task:created', payload);
};

export const emitTaskUpdated = (payload: TaskSocketPayload): void => {
  emitEvent('task:updated', payload);
};

export const emitTaskDeleted = (payload: TaskSocketPayload): void => {
  emitEvent('task:deleted', payload);
};

export const emitProjectCreated = (payload: ProjectSocketPayload): void => {
  emitEvent('project:created', payload);
};

export const emitProjectUpdated = (payload: ProjectSocketPayload): void => {
  emitEvent('project:updated', payload);
};

export const emitProjectDeleted = (payload: ProjectSocketPayload): void => {
  emitEvent('project:deleted', payload);
};
