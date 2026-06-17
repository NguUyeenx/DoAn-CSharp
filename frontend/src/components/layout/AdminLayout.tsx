import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FolderTree,
  Compass,
  SquareCheckBig,
  QrCode,
  Volume2,
  Globe,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Bell,
  History,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/api/admin';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/cn';

// Helper to safely extract username from JWT token
function getUsernameFromToken(token: string | null): string {
  if (!token) return 'Admin';
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
      'Admin'
    );
  } catch (e) {
    return 'Admin';
  }
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const { token, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const username = getUsernameFromToken(token);

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await adminApi.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch admin notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleNotificationClick = async (notif: any) => {
    try {
      if (!notif.isRead) {
        await adminApi.markNotificationRead(notif.id);
        // update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setBellOpen(false);

      // Redirect based on type
      if (notif.type === 'OwnerPending') {
        navigate('/admin/owners');
      } else if (notif.type === 'POIPending' || notif.type === 'POIUpdated') {
        navigate('/admin/pois/pending');
      }
    } catch (err) {
      console.error('Failed to process notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const menuItems = [
    { label: t('admin.nav.dashboard', 'Dashboard'), to: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('admin.nav.owners', 'Owners'), to: '/admin/owners', icon: Users },
    { label: t('admin.nav.pois', 'POIs'), to: '/admin/pois', icon: MapPin },
    { label: t('admin.nav.poisPending', 'POI Approvals'), to: '/admin/pois/pending', icon: ClipboardCheck },
    { label: t('admin.nav.category', 'Category'), to: '/admin/categories', icon: FolderTree },
    { label: t('admin.nav.tours', 'Tours'), to: '/admin/tours', icon: Compass },
    { label: t('admin.nav.quiz', 'Quiz'), to: '/admin/quiz', icon: SquareCheckBig },
    { label: t('admin.nav.qrCode', 'QR Code'), to: '/admin/qr', icon: QrCode },
    { label: t('admin.nav.audios', 'Audios'), to: '/admin/audios', icon: Volume2 },
    { label: t('admin.nav.language', 'Language'), to: '/admin/languages', icon: Globe },
    { label: t('admin.nav.auditLog', 'AuditLog'), to: '/admin/audit-logs', icon: FileSpreadsheet },
    { label: t('admin.nav.tripLogs', 'Nhật ký chuyến đi'), to: '/admin/trip-logs', icon: History },
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
            VK <span className="font-medium text-text-secondary">Admin Shell</span>
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
                    'flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 outline-none',
                    isActive
                      ? 'bg-primary text-white shadow-md font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                  )
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
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
            <span>{t('admin.nav.logout', 'Logout')}</span>
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
                  VK Admin
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
                        'flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 outline-none',
                        isActive
                          ? 'bg-primary text-white shadow-md font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                      )
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
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
                <span>{t('admin.nav.logout', 'Logout')}</span>
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
              {t('admin.header.title', 'Admin Management Console')}
            </h1>
          </div>

          {/* Admin Info Profile Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-alt rounded-lg transition-colors cursor-pointer outline-none relative"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  {/* Backdrop click closer */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBellOpen(false)}
                  />
                  {/* Dropdown panel */}
                  <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-[fade-in_0.15s_ease-out]">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-surface-alt">
                      <span className="text-xs font-bold text-text-primary">Thông báo Admin</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer outline-none"
                        >
                          Đánh dấu đã đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-text-muted text-xs">
                          Không có thông báo mới nào.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-xs cursor-pointer hover:bg-surface-alt/65 transition-colors ${
                              !n.isRead ? 'bg-primary/5 font-semibold' : 'text-text-secondary'
                            }`}
                          >
                            <p className="leading-snug text-text-primary">{n.message}</p>
                            <span className="text-[9px] text-text-muted mt-1 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('admin.header.role', 'Administrator')}
              </p>
              <p className="text-sm font-medium text-text-primary">{username}</p>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-display font-semibold text-sm">
              {username[0]?.toUpperCase() || 'A'}
            </div>

            <button
              onClick={logout}
              className="lg:hidden flex items-center justify-center p-2 rounded-md text-danger hover:bg-danger-light/10 transition-colors cursor-pointer"
              aria-label={t('admin.nav.logout', 'Logout')}
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
