import { NavLink } from 'react-router-dom';
import { Map, Search, QrCode, User, Settings } from 'lucide-react';

export default function BottomNav() {
  const tabs = [
    { to: '/', label: 'Explore', icon: Map },
    { to: '/discover', label: 'Discover', icon: Search },
    { to: '/scan', label: 'Scan', icon: QrCode },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6">
      <div className="flex h-full items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive ? 'text-emerald-500 scale-105' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
