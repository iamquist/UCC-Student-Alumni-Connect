import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials, RegisterData } from '@/types';
import { authApi } from '@/services/api';
import { socketService } from '@/services/socket';

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async ({ email, password }) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login(email, password);
          localStorage.setItem('unialum_token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('unialum_refresh_token', data.refreshToken);
          }
          socketService.connect(data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const result = await authApi.register(data);
          localStorage.setItem('unialum_token', result.token);
          socketService.connect(result.token);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('unialum_token');
        localStorage.removeItem('unialum_refresh_token');
        socketService.disconnect();
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchCurrentUser: async () => {
        const token = localStorage.getItem('unialum_token');
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }
        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          if (!socketService.isConnected()) {
            socketService.connect(token);
          }
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('unialum_token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'unialum-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
