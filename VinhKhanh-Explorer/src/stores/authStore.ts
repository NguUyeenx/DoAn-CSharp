import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize state from localStorage if available
  const storedToken = localStorage.getItem('vk_admin_token');

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
    login: (token: string) => {
      localStorage.setItem('vk_admin_token', token);
      set({ token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('vk_admin_token');
      set({ token: null, isAuthenticated: false });
    },
  };
});
