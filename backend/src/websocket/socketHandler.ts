import { Server, Socket } from 'socket.io';

interface ConnectedUser {
  userId: number;
  username: string;
  socketId: string;
}

const connectedUsers: Map<string, ConnectedUser> = new Map();

export const initializeWebSocket = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // Handle user authentication
    socket.on('authenticate', (userData: { userId: number; username: string }) => {
      connectedUsers.set(socket.id, {
        userId: userData.userId,
        username: userData.username,
        socketId: socket.id,
      });

      console.log(`✅ User authenticated: ${userData.username} (${socket.id})`);

      // Broadcast user online status
      io.emit('user:online', {
        userId: userData.userId,
        username: userData.username,
      });

      // Send list of online users
      const onlineUsers = Array.from(connectedUsers.values()).map((user) => ({
        userId: user.userId,
        username: user.username,
      }));
      socket.emit('users:online', onlineUsers);
    });

    // Handle task updates
    socket.on('task:update', (data: any) => {
      console.log('📝 Task updated:', data);
      io.emit('task:updated', data);
    });

    // Handle task creation
    socket.on('task:create', (data: any) => {
      console.log('➕ Task created:', data);
      io.emit('task:created', data);
    });

    // Handle task deletion
    socket.on('task:delete', (data: any) => {
      console.log('🗑️ Task deleted:', data);
      io.emit('task:deleted', data);
    });

    // Handle project updates
    socket.on('project:update', (data: any) => {
      console.log('📁 Project updated:', data);
      io.emit('project:updated', data);
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { userId: number; username: string; taskId: number }) => {
      socket.broadcast.emit('user:typing', data);
    });

    socket.on('typing:stop', (data: { userId: number; taskId: number }) => {
      socket.broadcast.emit('user:stopped_typing', data);
    });

    // Handle notifications
    socket.on('notification:send', (data: any) => {
      // Send notification to specific user if userId is provided
      if (data.targetUserId) {
        const targetUser = Array.from(connectedUsers.values()).find(
          (user) => user.userId === data.targetUserId
        );
        if (targetUser) {
          io.to(targetUser.socketId).emit('notification:received', data);
        }
      } else {
        // Broadcast to all users
        io.emit('notification:received', data);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`📴 User disconnected: ${user.username} (${socket.id})`);
        connectedUsers.delete(socket.id);

        // Broadcast user offline status
        io.emit('user:offline', {
          userId: user.userId,
          username: user.username,
        });
      } else {
        console.log(`📴 Unknown user disconnected: ${socket.id}`);
      }
    });
  });

  console.log('✅ WebSocket handlers initialized');
};

export const getConnectedUsers = (): ConnectedUser[] => {
  return Array.from(connectedUsers.values());
};