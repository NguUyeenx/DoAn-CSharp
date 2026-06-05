import type { ChangeEvent } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useSettingsStore } from '../../stores/settingsStore';
import { Globe } from 'lucide-react';

export default function MobileLayout() {
  const { language, setLanguage } = useSettingsStore();

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans select-none pb-16">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <span className="font-bold tracking-tight text-white">VinhKhanh Explorer</span>
        </div>
        
        {/* Language Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full text-zinc-300">
          <Globe className="h-4 w-4 text-emerald-500" />
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-transparent text-xs font-semibold focus:outline-none border-none pr-1 cursor-pointer"
          >
            <option value="en" className="bg-zinc-950 text-white">EN</option>
            <option value="vi" className="bg-zinc-950 text-white">VI</option>
            <option value="ja" className="bg-zinc-950 text-white">JA</option>
            <option value="ko" className="bg-zinc-950 text-white">KO</option>
            <option value="zh" className="bg-zinc-950 text-white">ZH</option>
          </select>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pt-14 px-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav Bar */}
      <BottomNav />
    </div>
  );
}
