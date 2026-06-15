import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Lock, User, X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toastError(t('auth.fieldsRequired', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'));
      return;
    }

    setLoading(true);
    try {
      const role = await login(username, password);
      success(t('auth.loginSuccess', 'Đăng nhập thành công!'));
      onClose(); // Close modal on success
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/owner');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const errMsg = err.response?.data?.message || t('auth.loginFailed', 'Đăng nhập thất bại.');
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-[fade-in_0.2s_ease-out]">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 z-10 animate-[scale-in_0.3s_ease-out]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full border border-border bg-card text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all cursor-pointer shadow-xs outline-none"
          aria-label={t('common.close', 'Close')}
        >
          <X size={16} />
        </button>

        {/* Branding header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <svg
              xmlns="http://www.w3.org/2005/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {t('auth.ownerLoginTitle', 'Kênh Chủ Quán / Đối Tác')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('auth.ownerLoginDesc', 'Quản lý thông tin địa điểm và thực đơn món ăn của bạn')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.username', 'Tên đăng nhập')}
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder', 'Nhập tên đăng nhập...')}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.password', 'Mật khẩu')}
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-text-muted" />
              <input
                type="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder', 'Nhập mật khẩu...')}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <span>{t('auth.login', 'Đăng nhập')}</span>
            )}
          </button>
        </form>

        {/* Redirect to register */}
        <div className="text-center text-xs text-text-secondary border-t border-border/60 pt-4">
          <span>{t('auth.noAccount', 'Chưa có tài khoản?')}</span>{' '}
          <button
            onClick={() => {
              onClose();
              navigate('/owner/register');
            }}
            className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            {t('auth.registerNow', 'Đăng ký làm đối tác')}
          </button>
        </div>
      </div>
    </div>
  );
}
