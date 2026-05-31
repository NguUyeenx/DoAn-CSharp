import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  QrCode, 
  UtensilsCrossed, 
  Activity, 
  Calendar 
} from 'lucide-react';

import { api } from '../../services/api';

// Extend the POI types with the Analytics Dto types
interface VisitsOverTimeDto {
  date: string;
  count: number;
}

interface PopularPOIDto {
  poiId: number;
  poiName: string;
  count: number;
}

interface AnalyticsData {
  totalVisits: number;
  visitsOverTime: VisitsOverTimeDto[];
  popularPOIs: PopularPOIDto[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  // Fetch statistical summary from backend api
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analyticsSummary'],
    queryFn: () => api.get<AnalyticsData>('/admin/analytics/summary'),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-zinc-500">
        <div className="w-8 h-8 border-4 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold">Fetching statistical logs...</span>
      </div>
    );
  }

  const summary = data || {
    totalVisits: 0,
    visitsOverTime: [],
    popularPOIs: []
  };

  return (
    <div className="p-6 text-white flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-zinc-400">
            Real-time geofencing hits, QR scans, and tourist engagement statistics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 text-xs font-semibold rounded-full border border-emerald-500/20">
          <Activity className="w-3.5 h-3.5" />
          <span>CMS Engine Active</span>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs font-medium">Total Tour Visits</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {summary.totalVisits.toLocaleString()}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs font-medium">Active Geofences</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">15</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400 text-xs font-medium">QR Active Signs</span>
            <span className="text-3xl font-extrabold tracking-tight text-white">15</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Graphs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits Over Time Area Chart */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm">Visitor Log Frequency (Visits over Time)</h3>
            </div>
          </div>
          <div className="w-full h-72">
            {summary.visitsOverTime.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                No visitor logs registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.visitsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#18181b', borderRadius: '12px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}
                    itemStyle={{ color: '#10b981', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" name="Visits" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Popular POIs Bar Chart */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-sm">Most Popular Stops (POI Engagement)</h3>
            </div>
          </div>
          <div className="w-full h-72">
            {summary.popularPOIs.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                No active POI hits logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.popularPOIs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="poiName" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#18181b', borderRadius: '12px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 600, fontSize: '12px' }}
                    itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Hits" radius={[6, 6, 0, 0]} maxBarSize={45}>
                    {summary.popularPOIs.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
