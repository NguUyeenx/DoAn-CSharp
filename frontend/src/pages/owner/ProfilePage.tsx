import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { profileUpdateEmitter } from '@/api/client';
import { useToast } from '@/components/ui/Toast';
import { User, Lock, Save, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  // Profile Form States
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Load profile details on mount
  useEffect(() => {
    let isSubscribed = true;
    authApi.getProfile()
      .then(({ data }) => {
        if (isSubscribed && data) {
          setDisplayName(data.displayName || '');
          setEmail(data.email || '');
        }
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        toastError(t('owner.profile.loadFailed', 'Không thể tải thông tin hồ sơ'));
      });
    return () => {
      isSubscribed = false;
    };
  }, [t, toastError]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toastError(t('owner.profile.nameRequired', 'Vui lòng nhập tên hiển thị'));
      return;
    }
    if (!email.trim()) {
      toastError(t('owner.profile.emailRequired', 'Vui lòng nhập email'));
      return;
    }

    setProfileSaving(true);
    try {
      await authApi.updateProfile({ displayName, email });
      profileUpdateEmitter.emit({ displayName: displayName.trim() });
      success(t('owner.profile.updateSuccess', 'Cập nhật hồ sơ thành công!'));
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toastError(err.response?.data?.message || t('owner.profile.updateFailed', 'Cập nhật hồ sơ thất bại'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError(t('owner.profile.fieldsRequired', 'Vui lòng điền đầy đủ thông tin mật khẩu'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError(t('auth.passwordsMismatch', 'Mật khẩu xác nhận không khớp'));
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      success(t('owner.profile.passwordSuccess', 'Đổi mật khẩu thành công!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toastError(err.response?.data?.message || t('owner.profile.passwordFailed', 'Đổi mật khẩu thất bại'));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Profile Update Form */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <User className="text-primary" size={18} />
          <h3 className="font-display font-extrabold text-sm sm:text-base text-text-primary">
            {t('owner.profile.title', 'Cập Nhật Thông Tin Hồ Sơ')}
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.profile.displayName', 'Tên hiển thị')}
            </label>
            <input
              type="text"
              disabled={profileSaving}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('owner.profile.namePlaceholder', 'Nhập tên hiển thị mới...')}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.profile.email', 'Email / Gmail')}
            </label>
            <input
              type="email"
              disabled={profileSaving}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('owner.profile.emailPlaceholder', 'Nhập địa chỉ email mới...')}
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-xs outline-none cursor-pointer"
          >
            {profileSaving ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <Save size={14} />
                <span>{t('owner.profile.save', 'Lưu thay đổi')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Password Change Form */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Lock className="text-primary" size={18} />
          <h3 className="font-display font-extrabold text-sm sm:text-base text-text-primary">
            {t('owner.profile.changePassword', 'Đổi Mật Khẩu')}
          </h3>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.profile.currentPassword', 'Mật khẩu hiện tại')}
            </label>
            <input
              type="password"
              disabled={passwordSaving}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.profile.newPassword', 'Mật khẩu mới')}
            </label>
            <input
              type="password"
              disabled={passwordSaving}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('owner.profile.confirmPassword', 'Xác nhận mật khẩu mới')}
            </label>
            <input
              type="password"
              disabled={passwordSaving}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={passwordSaving}
            className="h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-hover active:scale-95 transition-all shadow-xs outline-none cursor-pointer"
          >
            {passwordSaving ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <Save size={14} />
                <span>{t('owner.profile.savePassword', 'Đổi mật khẩu')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
