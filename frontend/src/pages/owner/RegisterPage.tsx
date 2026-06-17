import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Lock, User, Mail, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !displayName.trim() || !password.trim()) {
      toastError(t('auth.fieldsRequired', 'Vui lòng điền đầy đủ các thông tin cần thiết'));
      return;
    }

    if (password.length <= 6) {
      toastError(t('auth.passwordTooShort', 'Mật khẩu phải trên 6 ký tự.'));
      return;
    }

    if (password !== confirmPassword) {
      toastError(t('auth.passwordsMismatch', 'Mật khẩu xác nhận không khớp'));
      return;
    }

    setLoading(true);
    try {
      await authApi.ownerRegister({
        username,
        email,
        displayName,
        password,
      });

      success(t('auth.registerSuccess', 'Đăng ký thành công! Vui lòng thực hiện đóng phí đăng ký.'));
      navigate(`/owner/payment?username=${username}`);
    } catch (err: any) {
      console.error('Owner registration failed:', err);
      const errMsg = err.response?.data?.message || t('auth.registerFailed', 'Đăng ký thất bại. Tên đăng nhập hoặc email có thể đã được sử dụng.');
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 text-text-primary">
      {/* Return to login */}
      <Link
        to="/owner/login"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        <span>{t('auth.backToLogin', 'Quay lại đăng nhập')}</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-text-primary shadow-md">
            <ShieldAlert size={24} className="text-primary-dark" />
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {t('auth.ownerRegisterTitle', 'Đăng Ký Đối Tác')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('auth.ownerRegisterDesc', 'Đăng ký tài khoản để giới thiệu ẩm thực quán của bạn')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.displayName', 'Tên hiển thị / Tên quán')}
            </label>
            <div className="relative flex items-center">
              <ShieldAlert size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                disabled={loading}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.displayNamePlaceholder', 'Ví dụ: Quán Ốc Khánh...')}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Username */}
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

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.email', 'Địa chỉ Email')}
            </label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-text-muted" />
              <input
                type="email"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Password */}
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

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.confirmPassword', 'Xác nhận mật khẩu')}
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-text-muted" />
              <input
                type="password"
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder', 'Xác nhận lại mật khẩu...')}
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
              <span>{t('auth.register', 'Đăng ký')}</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary border-t border-border/60 pt-4">
          <span>{t('auth.haveAccount', 'Đã có tài khoản?')}</span>{' '}
          <Link to="/owner/login" className="text-primary font-bold hover:underline">
            {t('auth.login', 'Đăng nhập')}
          </Link>
        </div>
      </div>
    </div>
  );
}
