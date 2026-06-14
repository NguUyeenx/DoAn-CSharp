import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/hooks/useNotifications';
import { Check, Loader2, BellOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function NotificationListPage() {
  const { t } = useTranslation();
  const { error: toastError } = useToast();

  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (error) {
      toastError(t('owner.notifications.loadError', 'Không thể tải danh sách thông báo'));
    }
  }, [error, toastError, t]);

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    } catch (e) {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'OwnerApproved':
      case 'POIApproved':
        return <span className="text-accent">✅</span>;
      case 'OwnerRejected':
      case 'POIRejected':
        return <span className="text-danger">❌</span>;
      case 'POIUpdated':
        return <span className="text-primary">📝</span>;
      default:
        return <span className="text-secondary">🔔</span>;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-secondary gap-3">
        <Loader2 className="animate-spin text-primary" size={28} />
        <span className="text-xs font-semibold">{t('common.loading', 'Loading notifications...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary">
          {t('owner.notifications.title', 'Thông Báo')}
        </h2>
        <p className="text-xs text-text-secondary">
          {t('owner.notifications.desc', 'Xem lịch sử các thông báo duyệt phê duyệt địa điểm từ ban quản lý')}
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt border border-border flex items-center justify-center text-text-muted">
            <BellOff size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-extrabold text-base text-text-primary">
              {t('owner.notifications.emptyTitle', 'Hộp thư rỗng')}
            </h3>
            <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
              {t('owner.notifications.emptyDesc', 'Bạn chưa nhận được thông báo hệ thống nào ở thời điểm hiện tại.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60 shadow-sm">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                p-4 flex items-start gap-4 transition-colors select-none
                ${notif.isRead ? 'bg-card' : 'bg-primary/5 font-medium'}
              `}
            >
              {/* Type Emoji Icon */}
              <div className="w-9 h-9 rounded-xl bg-surface-alt border border-border flex items-center justify-center shrink-0">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
                  {notif.message}
                </p>
                <span className="text-[10px] text-text-muted mt-1.5 block font-normal">
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>

              {/* Mark as Read Button */}
              {!notif.isRead && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="p-1.5 rounded-lg border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-all cursor-pointer outline-none shrink-0"
                  title="Mark as Read"
                >
                  <Check size={12} className="stroke-[2.5px]" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
