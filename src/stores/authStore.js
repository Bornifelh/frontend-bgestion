import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = response.data;

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return response.data;
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data);
        const { user, accessToken, refreshToken } = response.data;

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return response.data;
      },

      logout: async () => {
        const { accessToken } = get();
        
        // Only call API if we have a token
        if (accessToken) {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            // Ignore logout errors - we're logging out anyway
            console.log('Logout completed');
          }
        }
        
        // Always clear local state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Clear auth state without API call (for error handling)
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        set({
          accessToken,
          refreshToken: newRefreshToken,
        });

        return accessToken;
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      setUser: (user) => {
        set({ user });
      },

      checkAuth: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Try to refresh token
          try {
            await get().refreshAccessToken();
            const response = await api.get('/auth/me');
            set({
              user: response.data,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (refreshError) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth check on app load
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth();
}
