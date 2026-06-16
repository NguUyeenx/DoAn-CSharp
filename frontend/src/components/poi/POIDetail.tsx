import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { POI, MenuItem } from '@/types/poi';
import { poisApi } from '@/api/pois';
import { menuApi } from '@/api/menu';
import POIGallery from './POIGallery';
import MenuList from './MenuList';
import AudioPlayer from './AudioPlayer';
import ReviewModal from './ReviewModal';
import {
  X,
  MapPin,
  Phone,
  Compass,
  FileQuestion,
  Globe,
  ExternalLink,
  ChevronUp,
  Star,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/utils/cn';

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2005/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface OperatingHourItem {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

const getDayName = (day: number, t: any) => {
  const days = [
    t('days.sunday', 'Chủ Nhật'),
    t('days.monday', 'Thứ Hai'),
    t('days.tuesday', 'Thứ Ba'),
    t('days.wednesday', 'Thứ Tư'),
    t('days.thursday', 'Thứ Năm'),
    t('days.friday', 'Thứ Sáu'),
    t('days.saturday', 'Thứ Bảy')
  ];
  return days[day];
};

const checkIsOpen = (hoursStr?: string) => {
  if (!hoursStr) return null;
  try {
    const hours: OperatingHourItem[] = JSON.parse(hoursStr);
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    
    const todayHours = hours.find(h => h.day === currentDay);
    if (!todayHours || todayHours.closed) return 'closed';
    
    if (currentTimeStr >= todayHours.open && currentTimeStr <= todayHours.close) {
      return 'open';
    }
    return 'closed';
  } catch {
    return null;
  }
};

// Snap point heights as vh fractions (mobile bottom sheet)
const SNAP_MINI = 42;  // default open position
const SNAP_FULL = 92;  // full sheet

type SnapPoint = 'mini' | 'full' | 'closed';

interface POIDetailProps {
  poiId: number | null;
  onClose: () => void;
  onShowDirections?: (poi: POI) => void;
  onStartQuiz?: (poiId: number) => void;
  initialSnap?: SnapPoint;
}

export default function POIDetail({
  poiId,
  onClose,
  onShowDirections,
  onStartQuiz,
  initialSnap,
}: POIDetailProps) {
  const { t, i18n } = useTranslation();
  const [poi, setPoi] = useState<POI | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile bottom sheet drag state
  const [snap, setSnap] = useState<SnapPoint>(initialSnap || 'mini');
  const [dragOffset, setDragOffset] = useState(0); // live drag delta in px
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset snap whenever a new POI is opened
  useEffect(() => {
    if (poiId) setSnap(initialSnap || 'mini');
  }, [poiId, initialSnap]);

  const [showReviewModal, setShowReviewModal] = useState(false);

  const fetchPoiData = useCallback(async (silent = false) => {
    if (!poiId) {
      setPoi(null);
      setMenuItems([]);
      setError(null);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);
    try {
      const [poiRes, menuRes] = await Promise.all([
        poisApi.getById(poiId, i18n.language),
        menuApi.getByPOI(poiId, i18n.language).catch(() => ({ data: [] })),
      ]);
      setPoi(poiRes.data);
      setMenuItems(menuRes.data);
    } catch {
      setError(t('poi.detailError', 'Could not load details for this food spot'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [poiId, i18n.language, t]);

  // Fetch POI and Menu details
  useEffect(() => {
    fetchPoiData();
  }, [fetchPoiData]);

  // Touch/Mouse drag handlers (mobile bottom sheet only)
  const getSnapHeight = (s: SnapPoint) => {
    if (s === 'full') return SNAP_FULL;
    if (s === 'mini') return SNAP_MINI;
    return 0;
  };

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    setIsDragging(true);
    setDragOffset(0);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current; // positive = dragging down
    setDragOffset(delta);
  }, []);

  const handleDragEnd = useCallback((clientY: number, velocityY: number) => {
    if (dragStartY.current === null) return;
    const delta = clientY - dragStartY.current;

    dragStartY.current = null;
    setIsDragging(false);
    setDragOffset(0);

    if (snap === 'mini') {
      if (delta < -60 || velocityY < -0.5) {
        setSnap('full');
      } else if (delta > 80 || velocityY > 0.5) {
        onClose();
      }
    } else if (snap === 'full') {
      if (delta > 80 || velocityY > 0.5) {
        setSnap('mini');
      }
    }
  }, [snap, onClose]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY);
  const onTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const delta = dragStartY.current !== null ? touch.clientY - dragStartY.current : 0;
    handleDragEnd(touch.clientY, delta > 0 ? 0.6 : -0.6);
  };

  // Mouse events (for desktop testing)
  const onMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientY);
    const onMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onUp = (ev: MouseEvent) => {
      const delta = dragStartY.current !== null ? ev.clientY - dragStartY.current : 0;
      handleDragEnd(ev.clientY, delta > 0 ? 0.6 : -0.6);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!poiId) return null;

  const snapH = getSnapHeight(snap);
  const baseTranslateVh = 100 - snapH;
  const liveTranslate = isDragging
    ? `calc(${baseTranslateVh}vh + ${Math.max(-snapH * window.innerHeight / 100 + 60, dragOffset)}px)`
    : `${baseTranslateVh}vh`;

  const contentScrollable = snap === 'full';

  return (
    <>
      {/* MOBILE: Backdrop (full open state only) */}
      <div
        className={cn(
          'fixed inset-0 z-30 md:hidden transition-opacity duration-300',
          snap === 'full' ? 'bg-black/50 pointer-events-auto' : 'bg-transparent pointer-events-none',
        )}
        onClick={() => snap === 'full' && setSnap('mini')}
      />

      {/* MOBILE: Bottom Sheet Container */}
      <div
        ref={sheetRef}
        className={cn(
          'md:hidden fixed z-40 bottom-0 inset-x-0 bg-card rounded-t-[var(--radius-xl)]',
          'border-t border-border shadow-xl flex flex-col',
          !isDragging && 'transition-transform duration-300 ease-[var(--ease-out-quint)]',
        )}
        style={{
          height: `${SNAP_FULL}vh`,
          transform: `translateY(${liveTranslate})`,
        }}
      >
        {/* Drag handle bar */}
        <div
          className="w-full h-8 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shrink-0 gap-1 touch-none select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 bg-border rounded-full" />
          {snap === 'mini' && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-text-muted">
              <ChevronUp size={10} />
              <span>{t('poi.dragToExpand', 'Kéo lên để mở rộng')}</span>
            </div>
          )}
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          <h2 className="font-display font-extrabold text-sm tracking-tight text-text-primary line-clamp-1 flex-1 mr-2">
            {poi?.localizedName || poi?.name || (loading ? 'Loading...' : '')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer outline-none shrink-0"
            aria-label={t('common.close', 'Close')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div
          className={cn(
            'flex-1 flex flex-col gap-4 px-4 pb-32 md:pb-8',
            contentScrollable ? 'overflow-y-auto scrollbar-thin' : 'overflow-hidden',
          )}
        >
          <SheetContent
            loading={loading}
            error={error}
            poi={poi}
            menuItems={menuItems}
            onClose={onClose}
            onShowDirections={onShowDirections}
            onStartQuiz={onStartQuiz}
            onOpenReview={() => setShowReviewModal(true)}
            languageCode={i18n.language}
            t={t}
          />
        </div>
      </div>

      {/* DESKTOP: Right sidebar panel */}
      <div
        className={cn(
          'hidden md:flex fixed z-40 bg-card border-border shadow-xl',
          'md:top-16 md:right-0 md:bottom-0 md:left-auto md:w-72 lg:w-96',
          'md:h-[calc(100vh-4rem)] md:rounded-none md:border-t-0 md:border-l md:flex-col',
          'transition-transform duration-300 ease-[var(--ease-out-quint)]',
          !poi && !loading ? 'translate-x-full' : 'translate-x-0',
        )}
      >
        {/* Desktop header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60 shrink-0">
          <h2 className="font-display font-extrabold text-base tracking-tight text-text-primary truncate flex-1 mr-2">
            {poi?.localizedName || poi?.name || t('poi.details', 'Chi tiết')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer outline-none"
            aria-label={t('common.close', 'Close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Desktop scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
          <SheetContent
            loading={loading}
            error={error}
            poi={poi}
            menuItems={menuItems}
            onClose={onClose}
            onShowDirections={onShowDirections}
            onStartQuiz={onStartQuiz}
            onOpenReview={() => setShowReviewModal(true)}
            languageCode={i18n.language}
            t={t}
          />
        </div>
      </div>

      {showReviewModal && poi && (
        <ReviewModal
          poiId={poi.id}
          poiName={poi.localizedName || poi.name}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            fetchPoiData(true);
            window.dispatchEvent(new CustomEvent('poi-updated'));
          }}
        />
      )}
    </>
  );
}

// ── Shared content component (used in both mobile sheet and desktop sidebar) ──
interface SheetContentProps {
  loading: boolean;
  error: string | null;
  poi: POI | null;
  menuItems: MenuItem[];
  onClose: () => void;
  onShowDirections?: (poi: POI) => void;
  onStartQuiz?: (poiId: number) => void;
  onOpenReview: () => void;
  languageCode: string;
  t: (key: string, fallback: string) => string;
}

function SheetContent({
  loading, error, poi, menuItems,
  onClose, onShowDirections, onStartQuiz, onOpenReview,
  languageCode, t,
}: SheetContentProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 w-full" aria-busy="true">
        <div className="w-full aspect-[16/10] rounded-[var(--radius-lg)] bg-surface-alt animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-3/4 rounded-md bg-surface-alt animate-pulse" />
          <div className="h-4 w-1/4 rounded-full bg-surface-alt animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="h-10 rounded-[var(--radius-md)] bg-surface-alt animate-pulse" />
          <div className="h-10 rounded-[var(--radius-md)] bg-surface-alt animate-pulse" />
        </div>
        <div className="h-24 rounded-[var(--radius-lg)] bg-surface-alt animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-full rounded bg-surface-alt animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-surface-alt animate-pulse" />
          <div className="h-3 w-4/6 rounded bg-surface-alt animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-danger gap-2">
        <p className="text-sm font-medium">{error}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-danger/10 border border-danger text-danger hover:bg-danger/15 cursor-pointer outline-none"
        >
          {t('common.close', 'Đóng')}
        </button>
      </div>
    );
  }

  if (!poi) return null;

  return (
    <>
      {/* Gallery */}
      <POIGallery images={poi.images || []} fallbackEmoji={poi.category[0] || '🍴'} />

      {/* Name + Category + Rating + Open Status */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display font-extrabold text-lg tracking-tight text-text-primary leading-tight">
          {poi.localizedName || poi.name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-[var(--radius-sm)] capitalize">
            {poi.category}
          </span>
          {poi.priceRange && (
            <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold rounded-[var(--radius-sm)]">
              {poi.priceRange === '1' && t('filter.priceBudget', 'Bình dân')}
              {poi.priceRange === '2' && t('filter.priceMidrange', 'Trung bình')}
              {poi.priceRange === '3' && t('filter.priceUpscale', 'Khá')}
            </span>
          )}
          {checkIsOpen(poi.operatingHours) === 'open' && (
            <span className="px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-600 text-[10px] font-bold rounded">
              {t('poi.openNow', 'Đang mở cửa')}
            </span>
          )}
          {checkIsOpen(poi.operatingHours) === 'closed' && (
            <span className="px-2 py-0.5 bg-danger/10 border border-danger/20 text-danger text-[10px] font-bold rounded">
              {t('poi.closed', 'Đã đóng cửa')}
            </span>
          )}
          {poi.rating > 0 && (
            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold ml-1">
              <Star size={12} className="fill-current" />
              <span>{poi.rating.toFixed(1)}</span>
              {poi.reviewCount > 0 && (
                <span className="text-text-muted font-normal">{poi.reviewCount}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onShowDirections?.(poi)}
            className="h-10 rounded-[var(--radius-md)] bg-primary text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-sm cursor-pointer outline-none"
          >
            <Compass size={15} />
            <span>{t('poi.getDirections', 'Đường đi')}</span>
          </button>
          <button
            type="button"
            onClick={() => onStartQuiz?.(poi.id)}
            className="h-10 rounded-[var(--radius-md)] border border-border bg-card text-text-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-alt active:scale-95 transition-all shadow-xs cursor-pointer outline-none"
          >
            <FileQuestion size={15} className="text-secondary-light" />
            <span>{t('poi.playQuiz', 'Thử thách')}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenReview}
          className="h-10 rounded-[var(--radius-md)] border border-primary/20 bg-primary/5 text-primary text-xs font-semibold flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-95 transition-all shadow-xs cursor-pointer outline-none"
        >
          <MessageSquare size={15} />
          <span>{t('poi.reviewPlace', 'Đánh giá quán này')}</span>
        </button>
      </div>

      {/* Audio Player */}
      {poi.audioText && (
        <AudioPlayer
          poiId={poi.id}
          audioText={poi.audioText}
          languageCode={languageCode}
        />
      )}

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <h4 className="font-display font-bold text-sm text-text-primary uppercase border-b border-border/40 pb-1">
          {t('poi.about', 'Giới thiệu')}
        </h4>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {poi.fullDescription || poi.shortDescription}
        </p>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col gap-2 p-3 bg-surface-alt rounded-[var(--radius-md)] border border-border text-xs text-text-secondary">
        {poi.address && (
          <div className="flex items-start gap-2.5">
            <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">{poi.address}</span>
          </div>
        )}
        {poi.phone && (
          <div className="flex items-center gap-2.5 mt-1">
            <Phone size={14} className="text-primary shrink-0" />
            <a href={`tel:${poi.phone}`} className="hover:underline hover:text-primary transition-colors font-medium">
              {poi.phone}
            </a>
          </div>
        )}
        {(poi.website || poi.facebookUrl || poi.googleMapsUrl) && (
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border/40 text-[11px] font-semibold text-text-primary text-wrap flex-wrap gap-y-1">
            {poi.website && (
              <a href={poi.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Globe size={12} /><span>Website</span><ExternalLink size={10} className="opacity-60" />
              </a>
            )}
            {poi.facebookUrl && (
              <a href={poi.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <FacebookIcon className="w-3 h-3" /><span>Facebook</span><ExternalLink size={10} className="opacity-60" />
              </a>
            )}
            {poi.googleMapsUrl && (
              <a href={poi.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                <MapPin size={12} /><span>Google Maps</span><ExternalLink size={10} className="opacity-60" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Operating Hours Card */}
      {poi.operatingHours && (
        <div className="flex flex-col gap-2 p-3 bg-surface-alt rounded-[var(--radius-md)] border border-border text-xs text-text-secondary">
          <h4 className="font-display font-bold text-sm text-text-primary uppercase border-b border-border/40 pb-1">
            {t('poi.operatingHours', 'Thời gian hoạt động')}
          </h4>
          <div className="flex flex-col gap-1.5 mt-1">
            {JSON.parse(poi.operatingHours).map((item: any) => {
              const isToday = new Date().getDay() === item.day;
              return (
                <div key={item.day} className={cn("flex items-center justify-between py-0.5 px-1 rounded", isToday && "bg-primary/5 font-semibold text-primary")}>
                  <span>{getDayName(item.day, t)}</span>
                  <span className="font-mono">
                    {item.closed ? t('poi.closed', 'Đóng cửa') : `${item.open} - ${item.close}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu */}
      {menuItems.length > 0 && <MenuList items={menuItems} />}

      {/* Mobile bottom spacer to clear navigation bar */}
      <div className="h-24 md:hidden shrink-0" aria-hidden="true" />
    </>
  );
}
