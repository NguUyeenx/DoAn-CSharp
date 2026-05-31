import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  TrendingUp, 
  ArrowUpRight, 
  Terminal,
  Settings,
  ChevronRight
} from 'lucide-react';

import { api } from '../../services/api';

interface AnalyticsData {
  totalVisits: number;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analyticsSummaryBrief'],
    queryFn: () => api.get<AnalyticsData>('/admin/analytics/summary'),
  });

  const totalVisits = data?.totalVisits ?? 0;

  return (
    <div className="p-6 text-white flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-xs text-zinc-400">
            Welcome to the VinhKhanh Explorer Content Management & Analytics Suite.
          </p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-xs font-semibold rounded-full border border-emerald-500/20">
          CMS Control Panel
        </span>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-1 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-bold tracking-wide uppercase">Active Spots (POIs)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight">15</span>
            <Link to="/admin/pois" className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-0.5">
              <span>CMS</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-1 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-bold tracking-wide uppercase">Total Visitor Hits</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight">
              {isLoading ? '...' : totalVisits.toLocaleString()}
            </span>
            <Link to="/admin/analytics" className="text-xs text-blue-400 font-semibold hover:text-blue-300 flex items-center gap-0.5">
              <span>View Charts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-1 shadow-sm">
          <span className="text-zinc-500 text-[10px] font-bold tracking-wide uppercase">Seeded QR Signs</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-3xl font-extrabold tracking-tight">15</span>
            <span className="text-xs text-zinc-500 font-medium">100% Active</span>
          </div>
        </div>
      </div>

      {/* Main CMS Directories Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Quick Directory list */}
        <div className="bg-zinc-900/35 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-sm border-b border-zinc-900 pb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Administrative Portals</span>
          </h3>
          <div className="flex flex-col gap-2">
            <Link
              to="/admin/pois"
              className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-xl hover:border-zinc-850 hover:bg-zinc-900/50 transition-all text-left text-sm"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-200">POI & Menu CMS Editor</span>
                  <span className="text-[10px] text-zinc-500">Add, edit, or soft delete walk tour destinations</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center justify-between p-3.5 bg-zinc-900/30 border border-zinc-900 rounded-xl hover:border-zinc-850 hover:bg-zinc-900/50 transition-all text-left text-sm"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-200">Visitor Trends Dashboard</span>
                  <span className="text-[10px] text-zinc-500">Track real-time scans and geofencing stats</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </Link>
          </div>
        </div>

        {/* CMS Introduction Description */}
        <div className="bg-zinc-900/20 border border-zinc-900/30 rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-zinc-300">
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>CMS Administration</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mt-1">
              Use the administrative CMS panel to manage tour POIs, bilingual translations, restaurant menu item lists, and render static QR codes dynamically using the backend engine. 
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Scan logs and geofence visitor events are calculated and updated in real-time under the analytics portal to help track explorer engagement.
            </p>
          </div>
          <div className="text-[10px] text-zinc-500 italic mt-4">
            DoAn-CSharp PWA Administration Console • v0.0.1
          </div>
        </div>
      </div>
    </div>
  );
}
