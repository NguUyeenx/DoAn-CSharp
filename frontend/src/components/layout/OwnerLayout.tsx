import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';
import { api } from '@/api/client';

// Helper to safely extract username from JWT token
function getUsernameFromToken(token: string | null): string {
  if (!token) return 'Owner';
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return (
      payload.unique_name ||
      payload.name ||
      payload.sub ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      'Owner'
    );
  } catch (e) {
    return 'Owner';
  }
}

export default function OwnerLayout() {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const username = getUsernameFromToken(token);

  // Poll for notifications count
  const getUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<any[]>('/notifications');
      if (res && Array.isArray(res.data)) {
        const count = res.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    getUnreadCount(); // fetch immediately

    const interval = setInterval(() => {
      getUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [getUnreadCount]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      label: t('owner.nav.dashboard', 'Dashboard'),
      to: '/owner/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: t('owner.nav.myPois', 'My POIs'),
      to: '/owner/pois',
      icon: Store,
    },
    {
      label: t('owner.nav.notifications', 'Notifications'),
      to: '/owner/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: t('owner.nav.profile', 'Profile / Password'),
      to: '/owner/profile',
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen flex bg-surface text-text-primary">
      {/* 1. PERSISTENT SIDEBAR - DESKTOP ONLY */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border/80 sticky top-0 h-screen shrink-0">
        {/* Logo and Brand Title */}
        <div className="h-16 px-6 border-b border-border/80 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-sm">
            VK
          </div>
          <span className="font-display font-extrabold text-base tracking-tight text-text-primary">
            VK <span className="font-medium text-text-secondary">Owner Panel</span>
          </span>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 outline-none group/item',
                    isActive
                      ? 'bg-primary text-white shadow-md font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full',
                      'bg-danger text-white ring-2 ring-card group-hover/item:ring-surface-alt transition-all'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-border/80 space-y-1">
          <NavLink
            to="/"
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors outline-none"
          >
            <Home size={18} />
            <span>Quay lại trang chủ</span>
          </NavLink>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-danger hover:bg-danger-light/10 transition-colors cursor-pointer outline-none"
          >
            <LogOut size={18} />
            <span>{t('owner.nav.logout', 'Logout')}</span>
          </button>
        </div>
      </aside>

      {/* 2. OVERLAY SIDEBAR DRAWER - MOBILE ONLY */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative flex flex-col w-64 max-w-xs bg-card h-full shadow-xl animate-slide-in-right">
            {/* Drawer Header with Close Button */}
            <div className="h-16 px-6 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold font-display text-sm">
                  VK
                </div>
                <span className="font-display font-extrabold text-base tracking-tight text-text-primary">
                  VK Owner
                </span>
              </div>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-alt cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 outline-none',
                        isActive
                          ? 'bg-primary text-white shadow-md font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold rounded-full bg-danger text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Drawer Footer Logout */}
            <div className="p-4 border-t border-border/80 space-y-1">
              <NavLink
                to="/"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors outline-none"
              >
                <Home size={18} />
                <span>Quay lại trang chủ</span>
              </NavLink>
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-danger hover:bg-danger-light/10 transition-colors cursor-pointer outline-none"
              >
                <LogOut size={18} />
                <span>{t('owner.nav.logout', 'Logout')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Sticky Header */}
        <header className="h-16 border-b border-border/80 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-alt cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display font-semibold text-lg text-text-primary hidden sm:block">
              {t('owner.header.title', 'Owner Workspace')}
            </h1>
          </div>

          {/* Owner Info Profile Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('owner.header.role', 'POI Owner')}
              </p>
              <p className="text-sm font-medium text-text-primary">{username}</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-display font-semibold text-sm">
              {username[0]?.toUpperCase() || 'O'}
            </div>

            <button
              onClick={logout}
              className="lg:hidden flex items-center justify-center p-2 rounded-md text-danger hover:bg-danger-light/10 transition-colors cursor-pointer"
              aria-label={t('owner.nav.logout', 'Logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Outlet Box */}
        <main className="flex-1 overflow-y-auto bg-surface-alt">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
