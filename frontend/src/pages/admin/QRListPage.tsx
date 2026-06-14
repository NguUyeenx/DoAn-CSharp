import { useEffect, useState } from 'react';
import { qrApi } from '@/api/qr';
import { poisApi } from '@/api/pois';
import type { POIListItem } from '@/types/poi';
import { Loader2, Plus, QrCode, ToggleLeft, ToggleRight, Download, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface QRCodeItem {
  id: number;
  poiId: number;
  poiName?: string;
  code: string;
  qrImageUrl: string;
  scanCount: number;
  isActive: boolean;
}

export default function QRListPage() {
  const { success, error: toastError } = useToast();

  const [qrCodes, setQrCodes] = useState<QRCodeItem[]>([]);
  const [pois, setPois] = useState<POIListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Add QR form state
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qrRes, poisRes] = await Promise.all([
        qrApi.adminGetAllQR(),
        poisApi.getAll(),
      ]);

      const poisList = poisRes.data;
      const qrList = qrRes.data.map((qr: any) => {
        const matchingPoi = poisList.find((p) => p.id === qr.poiId);
        return {
          ...qr,
          poiName: matchingPoi ? matchingPoi.name : `Food Spot #${qr.poiId}`,
        };
      });

      setQrCodes(qrList);
      setPois(poisList);
      if (poisList.length > 0) {
        setSelectedPoiId(poisList[0].id);
      }
    } catch (err) {
      console.error('Failed to load QR details:', err);
      toastError('Could not fetch QR codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoiId) return;

    // Check if POI already has a QR code in list
    const exists = qrCodes.some((q) => q.poiId === selectedPoiId);
    if (exists && !window.confirm('This food spot already has a generated QR code. Generate another one?')) {
      return;
    }

    setGenerating(true);
    try {
      await qrApi.adminGenerateQR(selectedPoiId);
      success('QR Code generated successfully!');
      loadData(); // reload
    } catch (err) {
      console.error('Failed to generate QR:', err);
      toastError('Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async (item: QRCodeItem) => {
    const newStatus = !item.isActive;
    try {
      await qrApi.adminToggleQRStatus(item.id, newStatus);
      setQrCodes((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, isActive: newStatus } : q))
      );
      success(newStatus ? 'QR code enabled' : 'QR code disabled');
    } catch (err) {
      console.error('Failed to toggle QR status:', err);
      toastError('Status update failed.');
    }
  };

  const handleDownload = (item: QRCodeItem) => {
    if (!item.qrImageUrl) {
      toastError('QR image URL not found.');
      return;
    }
    
    // For local files or base64 images
    const link = document.createElement('a');
    link.href = item.qrImageUrl;
    link.download = `vk_qr_${item.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Download started!');
  };

  if (loading && qrCodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading QR codes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          QR Code Manager
        </h2>
        <p className="text-xs text-text-secondary">
          Generate QR code stickers for Vĩnh Khánh food spots, monitor scanning metrics, and print tags
        </p>
      </div>

      {/* Generator Block */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <h3 className="font-display font-bold text-sm sm:text-base text-text-primary border-b border-border/40 pb-2.5 flex items-center gap-1.5">
          <QrCode size={18} className="text-primary" />
          <span>Generate POI QR Code</span>
        </h3>

        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Select Food Spot</label>
            <select
              value={selectedPoiId || ''}
              onChange={(e) => setSelectedPoiId(parseInt(e.target.value) || null)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none cursor-pointer"
            >
              {pois.map((poi) => (
                <option key={poi.id} value={poi.id}>
                  {poi.name} ({poi.category})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={generating}
            className="h-10 px-6 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer shrink-0"
          >
            {generating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            <span>Generate QR</span>
          </button>
        </form>
      </div>

      {/* QR Code list */}
      {qrCodes.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-text-muted">
          No QR Codes found. Generate one above!
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Sticker Preview</th>
                  <th className="p-4">Food Spot Name</th>
                  <th className="p-4">Unique Code</th>
                  <th className="p-4">Scan Count</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {qrCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 shrink-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-alt border border-border flex items-center justify-center relative group">
                        {item.qrImageUrl ? (
                          <img src={item.qrImageUrl} alt={item.code} className="w-full h-full object-contain p-1" />
                        ) : (
                          <ImageIcon size={18} className="text-primary opacity-40" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-text-primary">{item.poiName}</td>
                    <td className="p-4 font-mono font-bold text-text-secondary uppercase">{item.code}</td>
                    <td className="p-4 font-display font-extrabold text-accent text-sm">
                      {item.scanCount} scans
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
                      >
                        {item.isActive ? (
                          <ToggleRight className="text-accent stroke-[2.5px]" size={22} />
                        ) : (
                          <ToggleLeft className="text-text-muted stroke-[2.5px]" size={22} />
                        )}
                        <span>{item.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                        title="Download QR"
                      >
                        <Download size={14} />
                      </button>
                    </td>
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
