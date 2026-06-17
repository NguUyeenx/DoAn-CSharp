import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useToast } from '@/components/ui/Toast';
import { Loader2, CreditCard, User, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function OwnerPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();

  const username = searchParams.get('username') || '';

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username) {
      toastError(t('auth.payment.missingUsername', 'Không tìm thấy thông tin tài khoản cần đóng phí.'));
      navigate('/owner/login');
    }
  }, [username, navigate, t, toastError]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = value.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length >= 2) {
      setExpiry(`${value.slice(0, 2)}/${value.slice(2, 4)}`);
    } else {
      setExpiry(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');

    if (!cleanCardNumber.trim() || !cardHolder.trim() || !expiry.trim() || !cvv.trim()) {
      toastError(t('auth.fieldsRequired', 'Vui lòng điền đầy đủ các thông tin cần thiết'));
      return;
    }

    if (cleanCardNumber.length < 16) {
      toastError(t('auth.payment.invalidCardLength', 'Số thẻ phải đủ 16 chữ số'));
      return;
    }

    if (!cleanCardNumber.startsWith('4242')) {
      toastError(t('auth.payment.testCardRequired', 'Vui lòng sử dụng số thẻ test bắt đầu bằng 4242.'));
      return;
    }

    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    const match = expiry.match(expiryRegex);
    if (!match) {
      toastError(t('auth.payment.invalidExpiryFormat', 'Hạn sử dụng phải đúng định dạng MM/YY (ví dụ: 12/29)'));
      return;
    }
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      toastError(t('auth.payment.expiryExpired', 'Thẻ đã hết hạn sử dụng.'));
      return;
    }

    setLoading(true);
    try {
      await authApi.ownerPayFee({
        username,
        cardNumber: cleanCardNumber,
        cardHolder,
      });

      success(t('auth.payment.success', 'Đóng phí thành công! Tài khoản của bạn đang chờ phê duyệt.'));
      navigate('/owner/login');
    } catch (err: any) {
      console.error('Owner fee payment failed:', err);
      const errMsg = err.response?.data?.message || t('auth.payment.failed', 'Đóng phí thất bại. Vui lòng kiểm tra lại thông tin thẻ.');
      toastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 text-text-primary">
      <button
        onClick={() => navigate('/owner/login')}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
      >
        <ArrowLeft size={16} />
        <span>{t('auth.backToLogin', 'Quay lại đăng nhập')}</span>
      </button>

      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <CreditCard size={24} />
          </div>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
            {t('auth.payment.title', 'Thanh Toán Phí Đăng Ký')}
          </h2>
          <p className="text-xs text-text-secondary">
            {t('auth.payment.desc', 'Phí đăng ký đối tác (50.000đ) duy trì vĩnh viễn trên bản đồ Vĩnh Khánh')}
          </p>
        </div>

        {/* Amount Box */}
        <div className="bg-surface-alt border border-border rounded-xl p-4 flex justify-between items-center">
          <span className="text-xs font-semibold text-text-secondary">{t('auth.payment.amountLabel', 'Số tiền thanh toán')}</span>
          <span className="font-mono font-extrabold text-lg text-primary">50,000 VND</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Card Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.payment.cardNumber', 'Số thẻ tín dụng')}
            </label>
            <div className="relative flex items-center">
              <CreditCard size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                disabled={loading}
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* Card Holder */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              {t('auth.payment.cardHolder', 'Tên chủ thẻ')}
            </label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3 text-text-muted" />
              <input
                type="text"
                disabled={loading}
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {t('auth.payment.expiry', 'Hạn sử dụng')}
              </label>
              <div className="relative flex items-center">
                <Calendar size={16} className="absolute left-3 text-text-muted" />
                <input
                  type="text"
                  disabled={loading}
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                CVV
              </label>
              <div className="relative flex items-center">
                <ShieldCheck size={16} className="absolute left-3 text-text-muted" />
                <input
                  type="password"
                  disabled={loading}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                  placeholder="***"
                  maxLength={3}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-xs sm:text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Test Card Note */}
          <div className="text-[10px] text-text-secondary bg-surface-alt border border-border/80 p-2.5 rounded-xl flex flex-col gap-0.5 leading-normal">
            <span className="font-bold text-primary">💡 Gợi ý đóng phí thử nghiệm:</span>
            <span>- Số thẻ: <strong className="font-mono text-text-primary">4242 4242 4242 4242</strong></span>
            <span>- Hạn dùng và CVV nhập tuỳ ý (ví dụ: 12/29 và 123)</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-10 w-full rounded-xl bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-md cursor-pointer outline-none"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <span>{t('auth.payment.payNow', 'Thanh toán phí đăng ký')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
