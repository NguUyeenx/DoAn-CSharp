import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import { Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';

interface OwnerPending {
  id: number;
  username: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: string;
}

export default function OwnerApprovalPage() {
  const { success, error: toastError } = useToast();

  const [owners, setOwners] = useState<OwnerPending[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPendingOwners();
      setOwners(data);
    } catch (err: any) {
      console.error('Failed to load pending owners:', err);
      // Fallback mocks for UI/UX testing
      setOwners([
        {
          id: 1,
          username: 'oc_oanh',
          email: 'oanh@example.com',
          displayName: 'Quan Oc Oanh',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this owner account? They will be allowed to log in and register food spots.')) return;

    try {
      await adminApi.approveOwner(id);
      success('Owner account approved successfully!');
      setOwners((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error('Failed to approve owner:', err);
      toastError('Approval request failed.');
    }
  };

  const handleOpenReject = (id: number) => {
    setRejectId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;
    if (!rejectReason.trim()) {
      toastError('Please enter a rejection reason.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.rejectOwner(rejectId, rejectReason);
      success('Owner signup request rejected.');
      setOwners((prev) => prev.filter((o) => o.id !== rejectId));
      setIsRejectModalOpen(false);
    } catch (err) {
      console.error('Failed to reject owner:', err);
      toastError('Rejection request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && owners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">Loading pending owner signups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          Owner Signups Approvals
        </h2>
        <p className="text-xs text-text-secondary">
          Approve or reject pending store owner registrations to allow them store listings access
        </p>
      </div>

      {owners.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <ShieldAlert size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              No pending registrations
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              All store owners registration requests have been processed.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                  <th className="p-4">Tên hiển thị / Tên quán</th>
                  <th className="p-4">Tài khoản</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Ngày đăng ký</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 font-bold text-text-primary">{owner.displayName}</td>
                    <td className="p-4 font-mono">{owner.username}</td>
                    <td className="p-4 text-text-secondary">{owner.email}</td>
                    <td className="p-4 text-text-muted">{new Date(owner.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleApprove(owner.id)}
                        className="h-8 px-2.5 rounded-lg bg-accent text-white font-semibold flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
                      >
                        <Check size={14} className="stroke-[2.5px]" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleOpenReject(owner.id)}
                        className="h-8 px-2.5 rounded-lg border border-border bg-card text-danger font-semibold flex items-center gap-1 hover:bg-danger/5 active:scale-95 transition-all outline-none cursor-pointer"
                      >
                        <X size={14} className="stroke-[2.5px]" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Registration"
        size="sm"
      >
        <form onSubmit={handleReject} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Reason for rejection *
            </label>
            <textarea
              disabled={submitting}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid credentials, not a culinary store on Vinh Khanh street..."
              rows={3}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-danger text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
              <span>Reject Owner</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
