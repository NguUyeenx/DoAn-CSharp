import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { LayoutDashboard, MapPin, Milestone, BarChart3, LogOut, ShieldAlert } from 'lucide-react';

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  // Route-guard: Redirect to admin login if not authenticated
  // For development demo purposes, we allow viewing if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/scan" replace />; // Redirecting to scanning for now (or a login page later)
  }

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/pois', label: 'POI Manager', icon: MapPin },
    { to: '/admin/tours', label: 'Walking Tours', icon: Milestone },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex select-none font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-8 px-2 py-1">
            <ShieldAlert className="h-6 w-6 text-emerald-500" />
            <span className="font-bold tracking-tight text-white text-lg">VK Explorer CMS</span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-end px-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-white">Administrator</span>
              <span className="text-xs text-zinc-500">System Operator</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center border border-emerald-500/30">
              A
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-zinc-950/40">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
