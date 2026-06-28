import { useEffect, useState } from 'react';
import { adminApi } from '@/api/admin';
import { Loader2, Check, X, ShieldAlert, Lock, Unlock, KeyRound, Plus, Trash2 } from 'lucide-react';
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

interface OwnerListItem {
  id: number;
  username: string;
  email: string;
  displayName: string;
  ownerStatus: string;
  createdAt: string;
  lastLoginAt?: string;
  adminNote?: string;
  poiCount: number;
}

export default function OwnerApprovalPage() {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [owners, setOwners] = useState<OwnerPending[]>([]);
  const [allOwners, setAllOwners] = useState<OwnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allOwnersLoading, setAllOwnersLoading] = useState(false);

  // Create Owner Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Reject Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset Password Modal state
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordOwnerId, setResetPasswordOwnerId] = useState<number | null>(null);
  const [resetPasswordDisplayName, setResetPasswordDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPendingOwners();
      setOwners(data);
    } catch (err: any) {
      console.error('Failed to load pending owners:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOwners = async () => {
    setAllOwnersLoading(true);
    try {
      const { data } = await adminApi.getAllOwners();
      setAllOwners(data);
    } catch (err: any) {
      console.error('Failed to load all owners:', err);
    } finally {
      setAllOwnersLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
    loadAllOwners();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Duyệt tài khoản đối tác này? Họ sẽ được phép đăng nhập và đăng ký địa điểm.')) return;

    try {
      await adminApi.approveOwner(id);
      success('Duyệt tài khoản đối tác thành công!');
      setOwners((prev) => prev.filter((o) => o.id !== id));
      loadAllOwners(); // refresh directory
    } catch (err) {
      console.error('Failed to approve owner:', err);
      toastError('Thao tác duyệt thất bại.');
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
      toastError('Vui lòng nhập lý do từ chối.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.rejectOwner(rejectId, rejectReason);
      success('Đã từ chối đăng ký của đối tác.');
      setOwners((prev) => prev.filter((o) => o.id !== rejectId));
      setIsRejectModalOpen(false);
      loadAllOwners(); // refresh directory
    } catch (err) {
      console.error('Failed to reject owner:', err);
      toastError('Từ chối đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLock = async (id: number, currentStatus: string) => {
    const isLocked = currentStatus === 'suspended';
    const confirmMsg = isLocked
      ? 'Mở khóa tài khoản đối tác này?'
      : 'Tạm khóa tài khoản đối tác này? Họ sẽ bị ngắt kết nối và không thể đăng nhập.';
    if (!window.confirm(confirmMsg)) return;

    try {
      if (isLocked) {
        await adminApi.unlockOwner(id);
        success('Mở khóa tài khoản đối tác thành công!');
      } else {
        await adminApi.lockOwner(id);
        success('Đã khóa tài khoản đối tác!');
      }
      loadAllOwners();
    } catch (err) {
      console.error('Failed to toggle lock status:', err);
      toastError('Thao tác thất bại.');
    }
  };

  const handleOpenResetPassword = (id: number, displayName: string) => {
    setResetPasswordOwnerId(id);
    setResetPasswordDisplayName(displayName);
    setNewPassword('');
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordOwnerId) return;
    if (!newPassword.trim() || newPassword.length <= 6) {
      toastError('Mật khẩu mới phải trên 6 ký tự.');
      return;
    }

    setResetPasswordSubmitting(true);
    try {
      await adminApi.resetOwnerPassword(resetPasswordOwnerId, { newPassword });
      success(`Đã đặt lại mật khẩu cho đối tác '${resetPasswordDisplayName}' thành công!`);
      setIsResetPasswordModalOpen(false);
    } catch (err) {
      console.error('Failed to reset owner password:', err);
      toastError('Đặt lại mật khẩu thất bại.');
    } finally {
      setResetPasswordSubmitting(false);
    }
  };

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newEmail.trim() || !newDisplayName.trim() || !newOwnerPassword.trim()) {
      toastError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (newOwnerPassword.length <= 6) {
      toastError('Mật khẩu phải lớn hơn 6 ký tự.');
      return;
    }
    setCreateSubmitting(true);
    try {
      await adminApi.createOwner({
        username: newUsername,
        email: newEmail,
        displayName: newDisplayName,
        password: newOwnerPassword,
      });
      success('Thêm tài khoản đối tác thành công!');
      setIsCreateModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewDisplayName('');
      setNewOwnerPassword('');
      loadAllOwners();
    } catch (err: any) {
      console.error('Failed to create owner:', err);
      toastError(err.response?.data || 'Không thể tạo tài khoản đối tác.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteOwner = async (id: number, displayName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản đối tác '${displayName}'? Mọi địa điểm sở hữu bởi tài khoản này sẽ được chuyển về quyền sở hữu của Hệ thống.`)) {
      return;
    }
    try {
      await adminApi.deleteOwner(id);
      success('Xóa tài khoản đối tác thành công!');
      loadAllOwners();
    } catch (err) {
      console.error('Failed to delete owner:', err);
      toastError('Xóa tài khoản đối tác thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            Quản Lý Đối Tác (Owners)
          </h2>
          <p className="text-xs text-text-secondary">
            Duyệt đăng ký đối tác mới, quản lý trạng thái hoạt động và đặt lại mật khẩu
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-md outline-none cursor-pointer self-start sm:self-center"
        >
          <Plus size={16} />
          <span>Thêm đối tác</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer outline-none ${
            activeTab === 'pending'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Yêu cầu chờ duyệt ({owners.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer outline-none ${
            activeTab === 'all'
              ? 'border-primary text-primary font-extrabold'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Tất cả đối tác ({allOwners.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        /* PENDING OWNERS VIEW */
        loading && owners.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
            <Loader2 className="animate-spin text-primary" size={28} />
            <span className="text-xs font-semibold">Đang tải danh sách chờ duyệt...</span>
          </div>
        ) : owners.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
              <ShieldAlert size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-display font-extrabold text-base text-text-primary">
                Không có yêu cầu chờ duyệt
              </h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Tất cả các yêu cầu đăng ký đối tác mới đã được xử lý hoàn tất.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                    <th className="p-4">Tên đối tác / Tên quán</th>
                    <th className="p-4">Tài khoản</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Ngày đăng ký</th>
                    <th className="p-4 text-right">Thao tác</th>
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
                          className="h-8 px-3 rounded-lg bg-accent text-white font-semibold flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer text-[10px]"
                        >
                          <Check size={12} className="stroke-[2.5px]" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => handleOpenReject(owner.id)}
                          className="h-8 px-3 rounded-lg border border-border bg-card text-danger font-semibold flex items-center gap-1 hover:bg-danger/5 active:scale-95 transition-all outline-none cursor-pointer text-[10px]"
                        >
                          <X size={12} className="stroke-[2.5px]" />
                          <span>Từ chối</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ALL OWNERS DIRECTORY VIEW */
        allOwnersLoading && allOwners.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
            <Loader2 className="animate-spin text-primary" size={28} />
            <span className="text-xs font-semibold">Đang tải danh sách đối tác...</span>
          </div>
        ) : allOwners.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <h3 className="font-display font-extrabold text-base text-text-primary">Không có đối tác nào</h3>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-alt border-b border-border text-text-secondary font-bold uppercase tracking-wider">
                    <th className="p-4">Tên hiển thị</th>
                    <th className="p-4">Tài khoản</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Địa điểm sở hữu</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Đăng ký ngày</th>
                    <th className="p-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allOwners.map((owner) => (
                    <tr key={owner.id} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="p-4 font-bold text-text-primary">{owner.displayName}</td>
                      <td className="p-4 font-mono">{owner.username}</td>
                      <td className="p-4 text-text-secondary">{owner.email}</td>
                      <td className="p-4 font-bold text-center sm:text-left text-primary">{owner.poiCount} POI</td>
                      <td className="p-4">
                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider
                            ${
                              owner.ownerStatus === 'approved'
                                ? 'bg-accent/10 border-accent/20 text-accent'
                                : owner.ownerStatus === 'suspended'
                                ? 'bg-danger/10 border-danger/20 text-danger'
                                : owner.ownerStatus === 'pending'
                                ? 'bg-secondary/10 border-secondary/20 text-secondary-light'
                                : 'bg-surface-alt border-border text-text-muted'
                            }
                          `}
                        >
                          {owner.ownerStatus === 'approved' ? 'Hoạt động' : owner.ownerStatus === 'suspended' ? 'Khóa' : owner.ownerStatus}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted">{new Date(owner.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        {/* Lock / Unlock */}
                        {owner.ownerStatus === 'approved' ? (
                          <button
                            onClick={() => handleToggleLock(owner.id, owner.ownerStatus)}
                            className="p-1.5 border border-border bg-card text-danger hover:bg-danger/5 hover:border-danger/20 rounded-lg transition-colors cursor-pointer outline-none"
                            title="Khóa tài khoản đối tác"
                          >
                            <Lock size={13} />
                          </button>
                        ) : owner.ownerStatus === 'suspended' ? (
                          <button
                            onClick={() => handleToggleLock(owner.id, owner.ownerStatus)}
                            className="p-1.5 border border-border bg-card text-accent hover:bg-accent/5 hover:border-accent/20 rounded-lg transition-colors cursor-pointer outline-none"
                            title="Mở khóa tài khoản đối tác"
                          >
                            <Unlock size={13} />
                          </button>
                        ) : null}

                        {/* Reset Password */}
                        <button
                          onClick={() => handleOpenResetPassword(owner.id, owner.displayName)}
                          className="p-1.5 border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover rounded-lg transition-colors cursor-pointer outline-none"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Delete Owner */}
                        <button
                          onClick={() => handleDeleteOwner(owner.id, owner.displayName)}
                          className="p-1.5 border border-border bg-card text-danger hover:border-danger/5 hover:border-danger/20 rounded-lg transition-colors cursor-pointer outline-none"
                          title="Xóa tài khoản đối tác"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* REJECT DIALOG MODAL */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ Chối Đăng Ký Đối Tác"
        size="sm"
      >
        <form onSubmit={handleReject} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Lý do từ chối *
            </label>
            <textarea
              disabled={submitting}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Không cung cấp đủ giấy tờ chứng minh, quán không nằm trên trục đường Vĩnh Khánh..."
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
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-danger text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
            >
              {submitting ? <Loader2 className="animate-spin" size={14} /> : <X size={14} />}
              <span>Xác nhận từ chối</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={`Đặt lại mật khẩu: ${resetPasswordDisplayName}`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Mật khẩu mới *
            </label>
            <input
              type="password"
              disabled={resetPasswordSubmitting}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới từ 6 ký tự..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsResetPasswordModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={resetPasswordSubmitting}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {resetPasswordSubmitting ? <Loader2 className="animate-spin" size={14} /> : <KeyRound size={14} />}
              <span>Cập nhật mật khẩu</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE OWNER MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Thêm tài khoản đối tác mới"
        size="sm"
      >
        <form onSubmit={handleCreateOwner} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tên hiển thị / Tên quán *
            </label>
            <input
              type="text"
              disabled={createSubmitting}
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="e.g. Ốc Oanh"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              disabled={createSubmitting}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. ocoanh"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Email *
            </label>
            <input
              type="email"
              disabled={createSubmitting}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. contact@ocoanh.com"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Mật khẩu đăng nhập *
            </label>
            <input
              type="password"
              disabled={createSubmitting}
              value={newOwnerPassword}
              onChange={(e) => setNewOwnerPassword(e.target.value)}
              placeholder="Nhập mật khẩu từ 6 ký tự..."
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-border/40 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-border text-text-secondary rounded-xl hover:bg-surface-alt font-semibold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {createSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
              <span>Lưu tài khoản</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
