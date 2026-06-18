import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ownerApi } from '@/api/owner';
import type { POI } from '@/types/poi';
import { ArrowLeft, Loader2, QrCode, Download, Trash2, Calendar, Eye, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

interface QRCodeItem {
  id: number;
  poiId: number;
  code: string;
  qrImageUrl: string;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function QRPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const poiId = id ? parseInt(id, 10) : 0;

  const [poi, setPoi] = useState<POI | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    if (!poiId) return;
    setLoading(true);
    try {
      const [poiRes, qrRes] = await Promise.all([
        ownerApi.getMyPOI(poiId, 'en'),
        ownerApi.getPOIQRs(poiId),
      ]);
      setPoi(poiRes.data);
      // Sort: active first, then newest
      const sortedQrs = qrRes.data.sort((a: any, b: any) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setQrCodes(sortedQrs);
    } catch (err: any) {
      console.error('Failed to load QR codes details:', err);
      toastError(t('owner.qr.loadError', 'Không thể tải thông tin QR Code'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [poiId]);

  const handleGenerate = async () => {
    if (!poiId) return;

    const activeQr = qrCodes.find(q => q.isActive);
    const confirmMsg = activeQr
      ? t('owner.qr.generateConfirm', 'Cửa hàng của bạn đã có mã QR đang hoạt động. Việc tạo mã mới sẽ làm mã QR hiện tại bị vô hiệu hóa (không thể quét được nữa). Bạn có đồng ý tiếp tục?')
      : t('owner.qr.generateConfirmEmpty', 'Bạn có muốn tạo mã QR mới cho địa điểm này không?');

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setGenerating(true);
    try {
      await ownerApi.generatePOIQR(poiId);
      success(t('owner.qr.generateSuccess', 'Tạo mã QR thành công!'));
      await loadData();
    } catch (err) {
      console.error('Failed to generate QR:', err);
      toastError(t('owner.qr.generateError', 'Tạo mã QR thất bại.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (item: QRCodeItem) => {
    const confirmMsg = item.isActive
      ? t('owner.qr.deleteActiveConfirm', 'Đây là mã QR đang hoạt động của quán. Nếu xóa, khách du lịch sẽ không thể quét để xem thông tin nữa. Bạn có chắc chắn muốn xóa?')
      : t('owner.qr.deleteInactiveConfirm', 'Bạn có chắc chắn muốn xóa mã QR cũ này không?');

    if (!window.confirm(confirmMsg)) return;

    try {
      await ownerApi.deletePOIQR(item.id);
      success(t('owner.qr.deleteSuccess', 'Xóa mã QR thành công!'));
      setQrCodes(prev => prev.filter(q => q.id !== item.id));
    } catch (err) {
      console.error('Failed to delete QR:', err);
      toastError(t('owner.qr.deleteError', 'Xóa mã QR thất bại.'));
    }
  };

  const handleDownload = (item: QRCodeItem) => {
    if (!item.qrImageUrl) {
      toastError('Không tìm thấy đường dẫn ảnh QR.');
      return;
    }
    const link = document.createElement('a');
    link.href = item.qrImageUrl;
    link.download = `VK_QR_${poi?.slug || 'poi'}_${item.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success(t('owner.qr.downloadStarted', 'Đã bắt đầu tải ảnh xuống!'));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Đang tải thông tin...')}</span>
      </div>
    );
  }

  const activeQr = qrCodes.find(q => q.isActive);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/owner/pois"
          className="p-2 border border-border hover:border-border-hover bg-card hover:bg-surface-alt rounded-xl transition-all outline-none"
        >
          <ArrowLeft size={16} className="text-text-secondary" />
        </Link>
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Quản Lý QR Code
          </h2>
          <p className="text-xs text-text-secondary">
            Thiết lập mã QR định vị và xem số lượt quét của {poi?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active QR Code detail card */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center flex flex-col items-center justify-between gap-4 h-full">
            <div className="w-full">
              <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2 text-left mb-4">
                📲 Mã QR Đang Hoạt Động
              </h3>

              {activeQr ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl border border-border/60 shadow-inner w-44 h-44 flex items-center justify-center relative group overflow-hidden">
                    <img src={activeQr.qrImageUrl} alt="Active QR Code" className="w-full h-full object-contain" />
                    <button
                      onClick={() => handleDownload(activeQr)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity gap-1"
                    >
                      <Download size={20} />
                      <span className="text-[10px] font-bold">Tải Xuống</span>
                    </button>
                  </div>
                  <div className="w-full text-left space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Mã định danh:</span>
                      <span className="font-mono font-bold text-text-primary">{activeQr.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Lượt quét:</span>
                      <span className="font-bold text-primary flex items-center gap-1">
                        <Eye size={12} /> {activeQr.scanCount} lượt
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">Ngày tạo:</span>
                      <span className="text-text-primary">
                        {format(new Date(activeQr.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2">
                  <QrCode size={40} className="opacity-30" />
                  <span className="text-xs font-semibold">Chưa có mã QR hoạt động</span>
                  <p className="text-[10px] text-center max-w-[180px] leading-relaxed">
                    Tạo mới một mã QR bên dưới để bắt đầu sử dụng cho khách quét.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-xs outline-none"
            >
              {generating ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <>
                  <Plus size={14} />
                  <span>{activeQr ? 'Tạo Mã QR Mới' : 'Tạo Mã QR Đầu Tiên'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR History Table */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-full">
            <div>
              <h3 className="font-display font-bold text-xs uppercase text-text-primary tracking-wider border-b border-border/40 pb-2">
                📋 Lịch Sử Mã QR Đã Tạo
              </h3>
              <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                <AlertCircle size={10} className="text-primary shrink-0" />
                <span>Mỗi POI chỉ có tối đa 1 mã QR hoạt động (Active) tại một thời điểm.</span>
              </p>
            </div>

            {qrCodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2 flex-1">
                <QrCode size={32} className="opacity-30" />
                <span className="text-xs">Chưa có mã QR nào được tạo</span>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-text-secondary font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5">Ảnh</th>
                      <th className="py-2.5">Mã QR</th>
                      <th className="py-2.5">Lượt quét</th>
                      <th className="py-2.5">Trạng thái</th>
                      <th className="py-2.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {qrCodes.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-alt/25 transition-colors">
                        <td className="py-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-border bg-white p-0.5 flex items-center justify-center">
                            <img src={item.qrImageUrl} alt="QR Thumbnail" className="w-full h-full object-contain" />
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono font-bold text-text-primary">{item.code}</span>
                            <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                              <Calendar size={10} />
                              {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-text-primary">
                          {item.scanCount}
                        </td>
                        <td className="py-3">
                          {item.isActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/10 border border-accent/20 text-accent uppercase tracking-wider">
                              Hoạt động
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-neutral-100 border border-neutral-200 text-text-secondary uppercase tracking-wider dark:bg-neutral-800 dark:border-neutral-700">
                              Lưu trữ
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownload(item)}
                              className="p-1.5 border border-border hover:border-border-hover bg-card rounded-lg hover:text-primary transition-colors cursor-pointer outline-none"
                              title="Tải ảnh QR"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 border border-border hover:border-danger/40 bg-card rounded-lg text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors cursor-pointer outline-none"
                              title="Xóa QR"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
