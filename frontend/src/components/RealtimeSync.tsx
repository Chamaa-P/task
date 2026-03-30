import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { initializeSocket } from '../lib/socket';
import { useAuthStore } from '../store/authStore';

export default function RealtimeSync() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const socket = initializeSocket(user.id, user.username);

    const syncTasks = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    socket.on('task:created', syncTasks);
    socket.on('task:updated', syncTasks);
    socket.on('task:deleted', syncTasks);

    return () => {
      socket.off('task:created', syncTasks);
      socket.off('task:updated', syncTasks);
      socket.off('task:deleted', syncTasks);
    };
  }, [isAuthenticated, queryClient, user]);

  return null;
}
