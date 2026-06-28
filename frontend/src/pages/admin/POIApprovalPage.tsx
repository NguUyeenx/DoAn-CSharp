import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import { Loader2, Check, X, ShieldAlert, Eye, Edit3 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import POIDetail from '@/components/poi/POIDetail';

interface POIPending {
  id: number;
  name: string;
  category: string;
  address: string;
  shortDescription: string;
  ownerId: number;
  approvalStatus: string;
  createdAt: string;
}

export default function POIApprovalPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POIPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  const loadPOIs = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPendingPOIs();
      setPois(data);
    } catch (err: any) {
      console.error('Failed to load pending POIs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOIs();
  }, []);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} địa điểm này lên hệ thống?`)) return;

    setSubmitting(true);
    try {
      await adminApi.updatePOIStatus(id, status);
      success(`Địa điểm đã được ${status} thành công!`);
      setPois((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to update POI status:', err);
      toastError(`Thay đổi trạng thái thất bại.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Đang tải danh sách địa điểm chờ duyệt...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          Duyệt Địa Điểm (POI Listings)
        </h2>
        <p className="text-xs text-text-secondary">
          Xem xét và duyệt các yêu cầu đăng ký địa điểm ăn uống mới hoặc các thay đổi từ đối tác
        </p>
      </div>

      {pois.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <ShieldAlert size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              Không có địa điểm chờ duyệt
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              Tất cả các địa điểm đăng ký mới hoặc các thay đổi từ chủ quán đã được duyệt hết.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pois.map((poi) => (
            <div
              key={poi.id}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:border-border-hover transition-colors"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <button
                    onClick={() => setSelectedPoiId(poi.id)}
                    className="font-display font-bold text-base text-text-primary text-left hover:text-primary hover:underline cursor-pointer outline-none bg-transparent border-0 p-0"
                    title="Xem chi tiết địa điểm"
                  >
                    {poi.name}
                  </button>
                  <span className="px-2 py-0.5 bg-surface-alt text-text-secondary text-[10px] font-bold rounded-md capitalize border border-border">
                    {poi.category}
                  </span>
                </div>
                {poi.address && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-primary font-bold">📍</span> {poi.address}
                  </p>
                )}
                {poi.shortDescription && (
                  <p className="text-xs text-text-muted italic leading-relaxed">
                    "{poi.shortDescription}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPoiId(poi.id)}
                  className="px-3 h-9 rounded-lg border border-border bg-card text-text-secondary font-semibold text-xs hover:bg-surface-alt transition-all outline-none cursor-pointer flex items-center gap-1 shrink-0"
                  title="Xem chi tiết"
                >
                  <Eye size={13} />
                  <span>Chi tiết</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate(`/admin/pois/${poi.id}/edit`)}
                  className="px-3 h-9 rounded-lg border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-all outline-none cursor-pointer flex items-center gap-1 shrink-0"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit3 size={13} />
                  <span>Sửa</span>
                </button>
                
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(poi.id, 'approved')}
                  className="flex-1 h-9 rounded-lg bg-accent text-white font-semibold text-xs flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  <Check size={14} className="stroke-[2.5px]" />
                  <span>Duyệt</span>
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(poi.id, 'rejected')}
                  className="flex-1 h-9 rounded-lg border border-border bg-card text-danger font-semibold text-xs flex items-center justify-center gap-1 hover:bg-danger/5 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  <X size={14} className="stroke-[2.5px]" />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POI Details Fullscreen view overlay */}
      {selectedPoiId !== null && (
        <POIDetail
          poiId={selectedPoiId}
          onClose={() => setSelectedPoiId(null)}
        />
      )}
    </div>
  );
}
