import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { qrApi } from '@/api/qr';
import { visitorApi } from '@/api/visitor';
import { useVisitor } from '@/contexts/VisitorContext';
import { useToast } from '@/components/ui/Toast';
import { useTranslation } from 'react-i18next';
import { CreditCard, Loader2, ArrowLeft, ShieldCheck, Compass } from 'lucide-react';

export default function ActivatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const { sessionId, refreshStatus } = useVisitor();

  const code = new URLSearchParams(location.search).get('code') || '';

  const [poiName, setPoiName] = useState<string | null>(null);
  const [poiSlug, setPoiSlug] = useState<string | null>(null);
  const [loadingPoi, setLoadingPoi] = useState(false);

  // Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (code && sessionId) {
      setLoadingPoi(true);
      qrApi
        .scanQRCode(code, sessionId)
        .then(({ data }) => {
          if (data && !data.isActivated) {
            setPoiName(data.poiName);
            setPoiSlug(data.poiSlug);
          } else if (data && data.isActivated) {
            // If already activated, redirect to place detail
            navigate(`/place/${data.poi?.slug || data.poiSlug || ''}`, { replace: true, state: { fromQR: true } });
          }
        })
        .catch((err) => {
          console.error('Failed to pre-scan QR code:', err);
        })
        .finally(() => {
          setLoadingPoi(false);
        });
    }
  }, [code, sessionId, navigate]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format card number with spaces every 4 digits
    const rawVal = e.target.value.replace(/\s?/g, '');
    if (rawVal.length <= 16 && /^\d*$/.test(rawVal)) {
      const formatted = rawVal.replace(/(\d{4})(?=\d)/g, '$1 ');
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\//g, '');
    if (rawVal.length <= 4 && /^\d*$/.test(rawVal)) {
      const formatted = rawVal.replace(/(\d{2})(?=\d)/g, '$1/');
      setExpiry(formatted);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal.length <= 3 && /^\d*$/.test(rawVal)) {
      setCvv(rawVal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) {
      toastError('Vui lòng nhập đầy đủ 16 số thẻ.');
      return;
    }
    if (!cardHolder.trim()) {
      toastError('Vui lòng nhập tên chủ thẻ.');
      return;
    }
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    const match = expiry.match(expiryRegex);
    if (!match) {
      toastError('Vui lòng nhập ngày hết hạn đúng định dạng MM/YY (ví dụ: 12/29).');
      return;
    }
    const month = parseInt(match[1], 10);
    const year = parseInt('20' + match[2], 10);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      toastError('Thẻ đã hết hạn sử dụng.');
      return;
    }
    if (cvv.length < 3) {
      toastError('Vui lòng nhập mã bảo mật CVV.');
      return;
    }
    if (!sessionId) {
      toastError('Không tìm thấy Session ID. Vui lòng tải lại trang.');
      return;
    }

    console.log('Submitting activation request:', {
      sessionId,
      code: code || undefined,
      cardNumber: cleanCard,
      cardHolder: cardHolder.toUpperCase()
    });

    setSubmitting(true);
    try {
      const { data } = await visitorApi.activate({
        sessionId,
        code: code || undefined,
        cardNumber: cleanCard,
        cardHolder: cardHolder.toUpperCase(),
        languageCode: i18n.language,
      });

      toastSuccess(data.message || 'Kích hoạt thành công!');
      await refreshStatus();

      // Navigate to destination POI or homepage
      const targetSlug = code ? (data.redirectSlug || poiSlug) : null;
      if (targetSlug) {
        navigate(`/place/${targetSlug}`, { replace: true, state: { fromQR: true } });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      console.error('Payment activation failed:', err);
      const errMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : (err.response?.data?.message || 'Thanh toán thất bại. Vui lòng kiểm tra lại thông tin.');
      toastError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-primary">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Back Arrow */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-surface-alt transition-colors text-text-secondary cursor-pointer outline-none"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center flex flex-col items-center gap-2 mt-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm mb-1">
            <Compass size={24} className="animate-spin-slow" />
          </div>
          <h2 className="font-display font-extrabold text-xl">Kích hoạt bản đồ 24h</h2>
          <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
            Mở khóa đầy đủ các địa điểm thuyết minh, bản đồ hành trình và quiz tương tác.
          </p>
        </div>

        {/* Scanned Location Banner */}
        {loadingPoi ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-surface-alt border border-border/60 rounded-2xl animate-pulse">
            <Loader2 className="animate-spin text-text-muted" size={14} />
            <span className="text-[11px] text-text-secondary font-medium">Đang tìm thông tin quán...</span>
          </div>
        ) : poiName ? (
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col gap-1 text-left">
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Điểm quét hiện tại:</span>
            <span className="font-display font-extrabold text-sm text-text-primary">{poiName}</span>
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Số thẻ</label>
            <div className="relative">
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
                onChange={handleCardNumberChange}
                required
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-surface text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
              />
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Tên chủ thẻ</label>
            <input
              type="text"
              placeholder="NGUYEN VAN A"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Hạn dùng</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                required
                className="w-full h-11 px-4 text-center rounded-xl border border-border bg-surface text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wide">Mã CVV</label>
              <input
                type="password"
                placeholder="123"
                value={cvv}
                onChange={handleCvvChange}
                required
                className="w-full h-11 px-4 text-center rounded-xl border border-border bg-surface text-xs font-semibold focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
          </div>

          {/* Helper Note */}
          <div className="p-3 bg-surface-alt border border-border/50 rounded-2xl flex items-start gap-2.5 text-left mt-1 select-none">
            <ShieldCheck className="text-accent shrink-0 mt-0.5" size={16} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-wide">Môi trường giả lập</span>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                Để kích hoạt test, vui lòng sử dụng số thẻ bắt đầu bằng <strong className="text-accent font-semibold">4242 4242...</strong> Các thông tin khác nhập tùy ý.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 active:scale-95 transition-all shadow-md outline-none cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>Đang xử lý thanh toán...</span>
              </>
            ) : (
              <span>Thanh toán 20.000đ & Kích hoạt</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
