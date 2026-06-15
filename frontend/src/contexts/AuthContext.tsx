import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth';

function getStoredAuthKeys() {
  return {
    tokenKey: 'vk_token',
    refreshKey: 'vk_refresh_token',
    roleKey: 'vk_role',
    expiresKey: 'vk_expires',
    loginPath: '/owner/login',
  };
}

interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenExpired(expiresKey: string): boolean {
  const expiresAt = localStorage.getItem(expiresKey);
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

function clearStoredAuth(keys: ReturnType<typeof getStoredAuthKeys>) {
  localStorage.removeItem(keys.tokenKey);
  localStorage.removeItem(keys.refreshKey);
  localStorage.removeItem(keys.roleKey);
  localStorage.removeItem(keys.expiresKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // On mount: restore from localStorage if token is still valid
  useEffect(() => {
    const keys = getStoredAuthKeys();
    const storedToken = localStorage.getItem(keys.tokenKey);
    if (storedToken && !isTokenExpired(keys.expiresKey)) {
      setToken(storedToken);
      setRefreshToken(localStorage.getItem(keys.refreshKey));
      setRole(localStorage.getItem(keys.roleKey));
    } else {
      clearStoredAuth(keys);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const keys = getStoredAuthKeys();
    const { data } = await authApi.ownerLogin({ username, password });

    localStorage.setItem(keys.tokenKey, data.accessToken);
    localStorage.setItem(keys.refreshKey, data.refreshToken);
    localStorage.setItem(keys.roleKey, data.role);
    localStorage.setItem(keys.expiresKey, data.expiresAt);

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setRole(data.role);

    return data.role;
  }, []);

  const logout = useCallback(() => {
    const keys = getStoredAuthKeys();
    clearStoredAuth(keys);
    setToken(null);
    setRefreshToken(null);
    setRole(null);

    if (!window.location.pathname.startsWith(keys.loginPath)) {
      window.location.href = keys.loginPath;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      refreshToken,
      role,
      isAuthenticated: token !== null,
      login,
      logout,
      loginModalOpen,
      setLoginModalOpen,
    }),
    [token, refreshToken, role, login, logout, loginModalOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

