import axios from 'axios';
import type { RefreshTokenRequest } from '@/types/auth';

function getAuthKeys() {
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

export const api = axios.create({
  baseURL: '/api',
});

// Attach Bearer token to every request if one exists
api.interceptors.request.use((config) => {
  const { tokenKey } = getAuthKeys();
  const token = localStorage.getItem(tokenKey);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track whether a refresh is already in-flight to avoid duplicate refreshes
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { tokenKey, refreshKey, expiresKey, roleKey } = getAuthKeys();
    const storedRefresh = localStorage.getItem(refreshKey);
    if (!storedRefresh) {
      clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is in progress — queue this request
      return new Promise((resolve) => {
        addRefreshSubscriber((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const payload: RefreshTokenRequest = { refreshToken: storedRefresh };
      const { data } = await axios.post<any>(
        '/api/auth/refresh',
        payload,
      );

      localStorage.setItem(tokenKey, data.accessToken);
      localStorage.setItem(refreshKey, data.refreshToken);
      if (data.expiresAt) {
        localStorage.setItem(expiresKey, data.expiresAt);
      }
      if (data.role) {
        localStorage.setItem(roleKey, data.role);
      }

      onTokenRefreshed(data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch {
      clearTokens();
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

function clearTokens() {
  const { tokenKey, refreshKey, roleKey, expiresKey, loginPath } = getAuthKeys();
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  localStorage.removeItem(roleKey);
  localStorage.removeItem(expiresKey);

  // Only redirect if not already on the login page
  if (!window.location.pathname.startsWith(loginPath)) {
    window.location.href = loginPath;
  }
}

