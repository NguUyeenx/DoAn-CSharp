import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { qrApi } from '@/api/qr';
import { useToast } from '@/components/ui/Toast';
import { Loader2, QrCode } from 'lucide-react';

export default function QRScanPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError('Invalid QR code.');
      setLoading(false);
      return;
    }

    // Retrieve or generate a persistent Session ID for guest analytics
    let sessionId = localStorage.getItem('vk_session_id');
    if (!sessionId) {
      sessionId = `vk_sess_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      localStorage.setItem('vk_session_id', sessionId);
    }

    let isSubscribed = true;
    const processScan = async () => {
      try {
        const { data } = await qrApi.scanQRCode(code, sessionId!, i18n.language);
        if (isSubscribed) {
          if (data && data.isActivated) {
            if (data.poi && data.poi.slug) {
              navigate(`/place/${data.poi.slug}`, { replace: true });
            } else {
              throw new Error('Invalid POI details received.');
            }
          } else if (data && !data.isActivated) {
            // Redirect to activate page with code
            navigate(`/activate?code=${code}`, { replace: true });
          } else {
            throw new Error('Invalid scan response received.');
          }
        }
      } catch (err: any) {
        console.error('Error scanning QR code:', err);
        if (isSubscribed) {
          const errMsg = err.response?.data?.message || t('qr.scanError', 'Failed to scan QR code or it is disabled.');
          setError(errMsg);
          toastError(errMsg);
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    processScan();

    return () => {
      isSubscribed = false;
    };
  }, [code, navigate, t, i18n.language, toastError]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-primary">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8 flex flex-col items-center text-center gap-6 relative overflow-hidden">
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />

        {loading ? (
          <>
            {/* Swiping scanner visual overlay */}
            <div className="relative w-24 h-24 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-center overflow-hidden animate-pulse">
              <QrCode size={48} className="text-primary/45" />
              {/* Laser Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_var(--color-primary)] animate-[slide-up-down_2s_infinite_linear]" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-display font-extrabold text-lg text-text-primary">
                {t('qr.processing', 'Processing QR Code')}
              </h2>
              <p className="text-xs text-text-secondary">
                {t('qr.redirecting', 'Authenticating scan session and redirecting you...')}
              </p>
            </div>
            
            <Loader2 className="animate-spin text-primary" size={24} />
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger">
              <QrCode size={28} />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="font-display font-extrabold text-lg text-text-primary">
                {t('qr.failedTitle', 'Scan Failed')}
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {error || t('qr.failedDesc', 'We couldn\'t load the food spot details for this QR code. It may have been disabled.')}
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full h-10 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover active:scale-95 transition-all outline-none cursor-pointer"
            >
              {t('common.backHome', 'Back to Map')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
