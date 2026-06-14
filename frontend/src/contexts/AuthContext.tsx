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
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const isOwnerPath = window.location.pathname.startsWith('/owner');

  if (isAdminPath) {
    return {
      tokenKey: 'vk_admin_token',
      refreshKey: 'vk_admin_refresh_token',
      roleKey: 'vk_admin_role',
      expiresKey: 'vk_admin_expires',
      loginPath: '/admin/login',
    };
  } else if (isOwnerPath) {
    return {
      tokenKey: 'vk_owner_token',
      refreshKey: 'vk_owner_refresh_token',
      roleKey: 'vk_owner_role',
      expiresKey: 'vk_owner_expires',
      loginPath: '/owner/login',
    };
  } else {
    const hasOwnerToken = !!localStorage.getItem('vk_owner_token');
    if (hasOwnerToken) {
      return {
        tokenKey: 'vk_owner_token',
        refreshKey: 'vk_owner_refresh_token',
        roleKey: 'vk_owner_role',
        expiresKey: 'vk_owner_expires',
        loginPath: '/owner/login',
      };
    }
    return {
      tokenKey: 'vk_admin_token',
      refreshKey: 'vk_admin_refresh_token',
      roleKey: 'vk_admin_role',
      expiresKey: 'vk_admin_expires',
      loginPath: '/admin/login',
    };
  }
}

interface AuthContextValue {
  token: string | null;
  refreshToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
    const isAdminPath = window.location.pathname.startsWith('/admin');

    if (isAdminPath) {
      const { data } = await authApi.adminLogin({ username, password });

      localStorage.setItem(keys.tokenKey, data.accessToken);
      localStorage.setItem(keys.refreshKey, data.refreshToken);
      localStorage.setItem(keys.roleKey, data.role);
      localStorage.setItem(keys.expiresKey, data.expiresAt);

      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setRole(data.role);
    } else {
      const { data } = await authApi.ownerLogin({ username, password });

      localStorage.setItem(keys.tokenKey, data.accessToken);
      localStorage.setItem(keys.refreshKey, data.refreshToken);
      localStorage.setItem(keys.roleKey, 'owner');
      localStorage.setItem(keys.expiresKey, data.expiresAt);

      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setRole('owner');
    }
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
    }),
    [token, refreshToken, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

