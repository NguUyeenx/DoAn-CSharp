import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import { Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

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
  const { success, error: toastError } = useToast();

  const [pois, setPois] = useState<POIPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPOIs = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPendingPOIs();
      setPois(data);
    } catch (err: any) {
      console.error('Failed to load pending POIs:', err);
      // Fallback mocks for UI/UX testing
      setPois([
        {
          id: 5,
          name: 'Oc Oanh Che',
          category: 'Ốc',
          address: '53 Vĩnh Khánh, Quận 4, TP. HCM',
          shortDescription: 'Quán ốc gia truyền phong cách miền Nam.',
          ownerId: 2,
          approvalStatus: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOIs();
  }, []);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    if (!window.confirm(`${actionText} this point of interest listing?`)) return;

    setSubmitting(true);
    try {
      await adminApi.updatePOIStatus(id, status);
      success(`POI listing ${status} successfully!`);
      setPois((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to update POI status:', err);
      toastError(`Failed to update status to ${status}.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && pois.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading pending POIs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          POI Listings Approvals
        </h2>
        <p className="text-xs text-text-secondary">
          Review and approve food spot listing requests submitted by partners
        </p>
      </div>

      {pois.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <ShieldAlert size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              No pending POIs
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              All partner food spot listings registration requests have been processed.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pois.map((poi) => (
            <div
              key={poi.id}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-display font-bold text-base text-text-primary">{poi.name}</h3>
                  <span className="px-2 py-0.5 bg-surface-alt text-text-secondary text-[10px] font-bold rounded-md capitalize border border-border">
                    {poi.category}
                  </span>
                </div>
                {poi.address && (
                  <p className="text-xs text-text-secondary">
                    <span className="text-primary font-bold">📍</span> {poi.address}
                  </p>
                )}
                <p className="text-xs text-text-muted italic leading-relaxed">
                  "{poi.shortDescription}"
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(poi.id, 'approved')}
                  className="flex-1 h-9 rounded-lg bg-accent text-white font-semibold text-xs flex items-center justify-center gap-1 hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  <Check size={14} className="stroke-[2.5px]" />
                  <span>Approve</span>
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(poi.id, 'rejected')}
                  className="flex-1 h-9 rounded-lg border border-border bg-card text-danger font-semibold text-xs flex items-center justify-center gap-1 hover:bg-danger/5 active:scale-95 transition-all outline-none cursor-pointer"
                >
                  <X size={14} className="stroke-[2.5px]" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
