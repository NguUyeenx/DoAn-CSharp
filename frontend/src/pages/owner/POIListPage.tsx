import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '@/api/owner';
import type { POI } from '@/types/poi';
import { Plus, Edit3, UtensilsCrossed, Loader2, Image, Trash2, QrCode } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function POIListPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPOIs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ownerApi.getMyPOIs(i18n.language);
      setPois(data);
    } catch (err: any) {
      console.error('Failed to load owner POIs:', err);
      toastError(t('owner.poisLoadError', 'Không thể tải danh sách địa điểm'));
    } finally {
      setLoading(false);
    }
  }, [i18n.language, t, toastError]);

  useEffect(() => {
    fetchPOIs();
  }, [fetchPOIs]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('owner.pois.deleteConfirm', 'Bạn có chắc chắn muốn xóa địa điểm này không?'))) return;
    try {
      await ownerApi.deletePOI(id);
      success(t('owner.pois.deleteSuccess', 'Xóa địa điểm thành công!'));
      fetchPOIs();
    } catch (err) {
      console.error('Failed to delete POI:', err);
      toastError(t('owner.pois.deleteError', 'Xóa địa điểm thất bại.'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 border border-accent/25 text-accent uppercase tracking-wider">
            {t('status.approved', 'Approved')}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/10 border border-secondary/25 text-secondary-light uppercase tracking-wider animate-pulse">
            {t('status.pending', 'Pending')}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 border border-danger/25 text-danger uppercase tracking-wider">
            {t('status.rejected', 'Rejected')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-alt border border-border text-text-secondary uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading spots...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Register FAB */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {t('owner.pois.title', 'Địa Điểm Của Tôi')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('owner.pois.desc', 'Danh sách và trạng thái phê duyệt các cửa hàng ẩm thực của bạn')}
          </p>
        </div>

        <Link
          to="/owner/pois/new"
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none shrink-0"
        >
          <Plus size={16} />
          <span>{t('owner.pois.add', 'Đăng ký địa điểm')}</span>
        </Link>
      </div>

      {pois.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <UtensilsCrossed size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              {t('owner.pois.emptyTitle', 'Chưa có địa điểm nào')}
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              {t('owner.pois.emptyDesc', 'Bắt đầu đăng ký cửa hàng ẩm thực của bạn trên bản đồ du lịch Vĩnh Khánh ngay hôm nay.')}
            </p>
          </div>
          <Link
            to="/owner/pois/new"
            className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 transition-all outline-none"
          >
            {t('owner.pois.addNow', 'Đăng ký ngay')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pois.map((poi) => (
            <div
              key={poi.id}
              className="bg-card border border-border hover:border-border-hover hover:shadow-md rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
            >
              {/* Cover Photo Area */}
              <div className="h-40 bg-surface-alt relative overflow-hidden shrink-0">
                {poi.imageUrl ? (
                  <img
                    src={poi.imageUrl}
                    alt={poi.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-1 bg-primary/5">
                    <Image size={24} className="opacity-40 text-primary" />
                    <span className="text-[10px] font-semibold tracking-wider uppercase">No Cover Photo</span>
                  </div>
                )}
                {/* Status Float Badge */}
                <div className="absolute top-3 right-3 z-10 bg-card/90 backdrop-blur-xs p-1 px-1.5 rounded-lg border border-border/60">
                  {getStatusBadge(poi.approvalStatus)}
                </div>
              </div>

              {/* Info Details */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-base text-text-primary truncate">
                      {poi.name}
                    </h3>
                    <span className="px-2 py-0.5 bg-surface-alt text-text-secondary text-[10px] font-bold rounded-md capitalize border border-border">
                      {poi.category}
                    </span>
                  </div>
                  {poi.address && (
                    <p className="text-xs text-text-secondary line-clamp-1 flex items-center gap-1">
                      <span className="shrink-0 text-primary">📍</span>
                      <span>{poi.address}</span>
                    </p>
                  )}
                </div>

                {/* Grid Action controls */}
                <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Edit details */}
                    <button
                      onClick={() => navigate(`/owner/pois/${poi.id}/edit`)}
                      className="h-9 rounded-lg border border-border bg-card text-text-primary font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-alt active:scale-95 transition-all outline-none cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>{t('owner.pois.editDetails', 'Sửa tin')}</span>
                    </button>

                    {/* Menu items CRUD */}
                    <button
                      onClick={() => navigate(`/owner/pois/${poi.id}/menu`)}
                      className="h-9 rounded-lg bg-primary text-white font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-xs outline-none cursor-pointer"
                    >
                      <UtensilsCrossed size={13} />
                      <span>{t('owner.pois.manageMenu', 'Thực đơn')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Manage QR Code */}
                    <button
                      onClick={() => navigate(`/owner/pois/${poi.id}/qr`)}
                      className="h-9 rounded-lg border border-primary/35 bg-primary/5 text-primary font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/10 active:scale-95 transition-all outline-none cursor-pointer"
                    >
                      <QrCode size={13} />
                      <span>{t('owner.pois.manageQR', 'Mã QR')}</span>
                    </button>

                    {/* Delete POI */}
                    <button
                      onClick={() => handleDelete(poi.id)}
                      className="h-9 rounded-lg border border-danger/30 bg-card text-danger font-semibold flex items-center justify-center gap-1.5 hover:bg-danger/5 active:scale-95 transition-all outline-none cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{t('owner.pois.delete', 'Xóa')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
