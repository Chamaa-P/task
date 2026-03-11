import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initializeSocket, disconnectSocket } from '../lib/socket';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
        
        // Initialize WebSocket connection
        initializeSocket(user.id, user.username);
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
