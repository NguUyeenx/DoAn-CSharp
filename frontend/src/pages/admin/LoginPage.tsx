import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Loader2, Lock, User, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
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
      toastError(t('auth.fieldsRequired', 'Please fill in all credentials'));
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      success(t('auth.adminLoginSuccess', 'Admin authentication successful!'));
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Admin login failed:', err);
      const errMsg = err.response?.data?.message || t('auth.adminLoginFailed', 'Access Denied: Invalid admin credentials');
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 text-text-primary">
      {/* Return to Map Button */}
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        <span>{t('auth.backToMap', 'Back to map')}</span>
      </Link>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-md">
            <Lock size={22} />
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {t('auth.adminLoginTitle', 'Admin Control Panel')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('auth.adminLoginDesc', 'Manage users, approvals, language translations, and audio systems')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.username', 'Username')}
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.password', 'Password')}
            </label>
            <div className="relative flex items-center">
              <Lock size={16} className="absolute left-3 text-text-muted" />
              <input
                type="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
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
              <span>{t('auth.login', 'Sign In')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
