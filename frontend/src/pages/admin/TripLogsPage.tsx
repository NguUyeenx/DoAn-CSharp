import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/api/admin';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Search, Map, List, Eye, QrCode, Compass, HelpCircle, ArrowUpDown } from 'lucide-react';
import MapView from '@/components/map/MapView';
import { useMap } from '@/contexts/MapContext';
import mapboxgl from 'mapbox-gl';

interface VisitLogItem {
  id: number;
  poiId: number;
  poiName: string;
  latitude: number;
  longitude: number;
  sessionId: string;
  triggerType: string;
  languageCode: string;
  visitedAt: string;
}

// Child component that adds the heatmap layer to the active Mapbox instance
function VisitHeatmapLayer({ points }: { points: { lat: number; lng: number; weight: number; name: string }[] }) {
  const { map } = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    const sourceId = 'visits-heatmap-source';
    const layerId = 'visits-heatmap-layer';
    const pointLayerId = 'visits-point-layer';

    const geojson = {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        properties: {
          weight: p.weight,
          name: p.name,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })),
    };

    // Add source
    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojson as any);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson as any,
      });

      // Add heatmap layer
      map.addLayer({
        id: layerId,
        type: 'heatmap',
        source: sourceId,
        maxzoom: 18,
        paint: {
          // Increase the heatmap weight based on weight property
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0, 0,
            10, 1,
          ],
          // Increase the heatmap color weight weight by zoom level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            16, 3,
          ],
          // Color ramp for heatmap. Domain is 0 (low) to 1 (high).
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgba(45,212,191,0.5)',  // Teal
            0.4, 'rgba(34,197,94,0.7)',   // Green
            0.6, 'rgba(234,179,8,0.8)',   // Yellow
            0.8, 'rgba(249,115,22,0.9)',  // Orange
            1, 'rgba(239,68,68,1)',       // Red
          ],
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 6,
            16, 45,
          ],
          'heatmap-opacity': 0.8,
        },
      });

      // Add circle points on top when zoomed in
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        minzoom: 14,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 5,
            18, 14,
          ],
          'circle-color': '#f26522',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      });
    }

    // Zoom map bounds to fit points
    try {
      const bounds = points.reduce(
        (acc, p) => acc.extend([p.lng, p.lat]),
        new mapboxgl.LngLatBounds([points[0].lng, points[0].lat], [points[0].lng, points[0].lat])
      );
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 16.5,
      });
    } catch (e) {
      console.warn('Error adjusting map bounds:', e);
    }

    return () => {
      if (!map) return;
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {
        console.warn('Error cleaning up heatmap layer:', e);
      }
    };
  }, [map, points]);

  return null;
}

export default function TripLogsPage() {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const [logs, setLogs] = useState<VisitLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'heatmap'>('list');

  // Search & filter state
  const [search, setSearch] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  
  // Pagination & Sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);
  const itemsPerPage = 12;

  useEffect(() => {
    let isSubscribed = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.getVisitLogs();
        if (isSubscribed) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to load visit logs:', err);
        toastError(t('admin.triplogs.loadError', 'Không thể tải nhật ký chuyến đi.'));
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchLogs();
    return () => { isSubscribed = false; };
  }, [t, toastError]);

  // Compute stats metrics
  const statsMetrics = useMemo(() => {
    const totalVisits = logs.length;
    const uniqueSessions = new Set(logs.map((l) => l.sessionId)).size;
    
    const spotCounts: Record<string, number> = {};
    logs.forEach((l) => {
      spotCounts[l.poiName] = (spotCounts[l.poiName] || 0) + 1;
    });
    
    let topSpot = 'N/A';
    let topSpotCount = 0;
    Object.entries(spotCounts).forEach(([name, count]) => {
      if (count > topSpotCount) {
        topSpot = name;
        topSpotCount = count;
      }
    });

    return { totalVisits, uniqueSessions, topSpot, topSpotCount };
  }, [logs]);

  // Compute heatmap coordinates
  const heatmapPoints = useMemo(() => {
    const counts: Record<string, { lat: number; lng: number; weight: number; name: string }> = {};
    logs.forEach((log) => {
      if (log.latitude && log.longitude && log.latitude !== 0 && log.longitude !== 0) {
        const key = `${log.latitude}_${log.longitude}`;
        if (!counts[key]) {
          counts[key] = { lat: log.latitude, lng: log.longitude, weight: 0, name: log.poiName };
        }
        counts[key].weight += 1;
      }
    });
    return Object.values(counts);
  }, [logs]);

  // Filters logic
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.poiName.toLowerCase().includes(q) ||
          l.sessionId.toLowerCase().includes(q)
      );
    }

    if (triggerFilter !== '') {
      result = result.filter((l) => l.triggerType === triggerFilter);
    }

    if (langFilter !== '') {
      result = result.filter((l) => l.languageCode === langFilter);
    }

    // Sort by VisitedAt
    result.sort((a, b) => {
      const dateA = new Date(a.visitedAt).getTime();
      const dateB = new Date(b.visitedAt).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [logs, search, triggerFilter, langFilter, sortAsc]);

  // Pagination logic
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const renderTriggerBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'qr':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-600 dark:text-teal-400 font-semibold text-[10px]">
            <QrCode size={11} />
            Quét QR
          </span>
        );
      case 'geofence':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-primary/10 border border-primary/20 text-primary font-semibold text-[10px]">
            <Compass size={11} />
            Định vị
          </span>
        );
      case 'manual':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-surface-alt border border-border text-text-secondary font-semibold text-[10px]">
            <Eye size={11} />
            Bấm chọn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-sm)] bg-surface-alt border border-border text-text-muted font-semibold text-[10px]">
            <HelpCircle size={11} />
            {type}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading visit logs...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            🗺️ Nhật Ký Chuyến Đi
          </h2>
          <p className="text-xs text-text-secondary">
            Theo dõi mật độ và lịch sử hoạt động khám phá phố ẩm thực của du khách
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-card border border-border rounded-xl p-1 shrink-0 self-start">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all outline-none cursor-pointer ${
              activeTab === 'list'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <List size={14} />
            <span>Danh sách hoạt động</span>
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all outline-none cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Map size={14} />
            <span>Bản đồ mật độ</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Tổng lượt truy cập</span>
          <p className="text-xl font-display font-extrabold text-text-primary mt-1">{statsMetrics.totalVisits}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Thiết bị duy nhất (Sessions)</span>
          <p className="text-xl font-display font-extrabold text-text-primary mt-1">{statsMetrics.uniqueSessions}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-xs col-span-2">
          <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Địa điểm ghé thăm nhiều nhất</span>
          <p className="text-sm font-semibold text-text-primary mt-1 truncate">
            {statsMetrics.topSpot} 
            {statsMetrics.topSpotCount > 0 && (
              <span className="text-text-muted font-normal text-xs ml-1.5">
                ({statsMetrics.topSpotCount} lượt)
              </span>
            )}
          </p>
        </div>
      </div>

      {activeTab === 'heatmap' ? (
        /* HEATMAP VIEW */
        <div className="bg-card border border-border rounded-2xl shadow-md overflow-hidden relative">
          <div className="h-[60vh] min-h-[450px]">
            <MapView>
              <VisitHeatmapLayer points={heatmapPoints} />
            </MapView>
          </div>
          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border/80 p-3 rounded-xl shadow-lg z-10 text-[10px] text-text-secondary max-w-[200px] flex flex-col gap-1.5">
            <span className="font-bold text-text-primary">Mật độ ghé thăm:</span>
            <div className="h-2.5 w-full rounded-sm bg-gradient-to-r from-teal-400 via-green-400 via-yellow-400 via-orange-400 to-red-500" />
            <div className="flex justify-between text-[9px] font-semibold">
              <span>Thấp</span>
              <span>Trung bình</span>
              <span>Cao</span>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVITY LIST VIEW */
        <div className="bg-card border border-border rounded-2xl shadow-md p-5 sm:p-6 flex flex-col gap-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex items-center flex-1">
              <Search size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm theo tên cửa hàng hoặc Session ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none"
              />
            </div>

            {/* Trigger Filter */}
            <select
              value={triggerFilter}
              onChange={(e) => {
                setTriggerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none font-semibold text-text-secondary"
            >
              <option value="">Tất cả phương thức kích hoạt</option>
              <option value="qr">Quét mã QR</option>
              <option value="geofence">Định vị GPS (Geofence)</option>
              <option value="manual">Bấm chọn bản đồ</option>
            </select>

            {/* Language Filter */}
            <select
              value={langFilter}
              onChange={(e) => {
                setLangFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 rounded-xl border border-border bg-card text-xs focus:border-primary focus:outline-none font-semibold text-text-secondary"
            >
              <option value="">Tất cả ngôn ngữ</option>
              <option value="vi">Tiếng Việt (VI)</option>
              <option value="en">English (EN)</option>
              <option value="ja">日本語 (JA)</option>
              <option value="ko">한국어 (KO)</option>
              <option value="zh">中文 (ZH)</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-text-muted font-bold">
                  <th 
                    className="py-2.5 px-3 cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setSortAsc(!sortAsc)}
                  >
                    <div className="flex items-center gap-1">
                      <span>Thời gian</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Cửa hàng ghé thăm</th>
                  <th className="py-2.5 px-3">Session ID thiết bị</th>
                  <th className="py-2.5 px-3">Phương thức</th>
                  <th className="py-2.5 px-3 text-center">Ngôn ngữ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-text-secondary">
                        {new Date(log.visitedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-text-primary">
                        {log.poiName}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-text-secondary">
                        {log.sessionId || 'Logged User'}
                      </td>
                      <td className="py-3 px-3">
                        {renderTriggerBadge(log.triggerType)}
                      </td>
                      <td className="py-3 px-3 text-center uppercase font-bold text-primary">
                        {log.languageCode}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      Không tìm thấy bản ghi nhật ký chuyến đi nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 pt-4 gap-4">
              <span className="text-[10px] text-text-muted font-medium">
                Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} trong tổng số{' '}
                {filteredLogs.length} bản ghi
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold bg-card disabled:opacity-50 outline-none cursor-pointer"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold outline-none cursor-pointer ${
                      currentPage === page
                        ? 'bg-primary border-primary text-white'
                        : 'bg-card border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold bg-card disabled:opacity-50 outline-none cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
