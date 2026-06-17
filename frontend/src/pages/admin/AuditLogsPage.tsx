import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/api/admin';
import { Loader2, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: number;
  userId?: number;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export default function AuditLogsPage() {

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      // Remove mock logs fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return (
        log.userName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        log.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
        log.details.toLowerCase().includes(searchFilter.toLowerCase())
      );
    });
  }, [logs, searchFilter]);

  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading system audit logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            System Audit Logs
          </h2>
          <p className="text-xs text-text-secondary">
            Trace and inspect administrative actions and store content alterations across the platform
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 border border-border bg-card rounded-xl hover:bg-surface-alt transition-all cursor-pointer outline-none"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter audit logs by user, action type, or description details..."
          className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
        />
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted">
          No audit logs found.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 font-mono text-text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-bold text-text-primary">{log.userName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-surface-alt border border-border font-mono font-extrabold text-[10px] uppercase text-text-secondary tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-text-secondary leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
