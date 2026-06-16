import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { poisApi } from '@/api/pois';
import { cn } from '@/utils/cn';

interface ReviewModalProps {
  poiId: number;
  poiName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ poiId, poiName, onClose, onSuccess }: ReviewModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || rating < 1 || rating > 5) return;
    
    setLoading(true);
    setError(null);
    try {
      await poisApi.submitReview(poiId, {
        visitorName: name,
        visitorPhone: phone,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(t('poi.reviewError', 'An error occurred while submitting your review.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-sm rounded-[var(--radius-lg)] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
          <h2 className="font-display font-bold text-text-primary text-base">
            {t('poi.reviewPlace', 'Đánh giá quán')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-text-secondary">
            {t('poi.reviewDesc', 'Chia sẻ trải nghiệm của bạn tại')} <strong className="text-text-primary">{poiName}</strong>
          </p>

          {error && (
            <div className="p-2 bg-danger/10 text-danger border border-danger/20 rounded-md text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              {t('poi.yourName', 'Tên của bạn')}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder={t('poi.namePlaceholder', 'Nhập tên của bạn')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              {t('poi.yourPhone', 'Số điện thoại')}
            </label>
            <input
              type="tel"
              required
              pattern="[0-9]*"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-border rounded-md text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder={t('poi.phonePlaceholder', 'Nhập số điện thoại')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-primary">
              {t('poi.comment', 'Nhận xét (Tùy chọn)')}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full h-20 p-3 bg-surface border border-border rounded-md text-sm text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
              placeholder={t('poi.commentPlaceholder', 'Chia sẻ thêm về trải nghiệm của bạn...')}
            />
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="text-xs font-semibold text-text-primary text-center">
              {t('poi.rating', 'Đánh giá (1-5 sao)')}
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition-all outline-none"
                >
                  <Star
                    size={28}
                    className={cn(
                      "transition-colors",
                      star <= rating ? "fill-amber-500 text-amber-500" : "fill-transparent text-border"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? t('common.loading', 'Đang xử lý...') : t('poi.submitReview', 'Gửi đánh giá')}
          </button>
        </form>
      </div>
    </div>
  );
}
