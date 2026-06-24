import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Phone, Compass, FileQuestion, Globe, Share2, Star, Heart, Clock } from 'lucide-react';
import { poisApi } from '@/api/pois';

interface OperatingHourItem {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}
import { menuApi } from '@/api/menu';
import { analyticsApi } from '@/api/analytics';
import type { POI, MenuItem } from '@/types/poi';
import POIGallery from '@/components/poi/POIGallery';
import MenuList from '@/components/poi/MenuList';
import AudioPlayer from '@/components/poi/AudioPlayer';
import MapView from '@/components/map/MapView';
import POIMarker from '@/components/map/POIMarker';
import { useToast } from '@/components/ui/Toast';
import { useVisitor } from '@/contexts/VisitorContext';

export default function POIDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromQR = !!(location.state as any)?.fromQR;
  const { t, i18n } = useTranslation();
  const { success } = useToast();

  const [poi, setPoi] = useState<POI | null>(null);
  const { bookmarks, toggleBookmark } = useVisitor();
  const isBookmarked = poi ? bookmarks.includes(poi.id) : false;
  const handleToggleBookmark = () => {
    if (poi) toggleBookmark(poi.id);
  };
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isSubscribed = true;
    const fetchPoiData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: poiData } = await poisApi.getBySlug(slug, i18n.language);
        if (isSubscribed) {
          setPoi(poiData);
          
          // Fetch menu
          try {
            const { data: menuData } = await menuApi.getByPOI(poiData.id, i18n.language);
            setMenuItems(menuData);
          } catch (mErr) {
            console.warn('Failed to fetch menu items:', mErr);
            setMenuItems([]);
          }
        }
      } catch (err) {
        console.error('Error fetching POI details page:', err);
        if (isSubscribed) {
          setError(t('poi.detailError', 'Could not load details for this food spot'));
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    };

    fetchPoiData();

    return () => {
      isSubscribed = false;
    };
  }, [slug, i18n.language]);

  // Update the language of the recent visit log if language changes
  useEffect(() => {
    if (!poi) return;

    const updateLogLanguage = async () => {
      const sessionId = localStorage.getItem('vk_session_id');
      if (sessionId) {
        try {
          await analyticsApi.updateVisitLanguage({
            poiId: poi.id,
            sessionId,
            languageCode: i18n.language,
          });
        } catch (err) {
          console.warn('Failed to update visit language:', err);
        }
      }
    };

    updateLogLanguage();
  }, [poi?.id, i18n.language]);

  const handleShare = async () => {
    if (!poi) return;
    const shareData = {
      title: poi.name,
      text: poi.shortDescription,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        success(t('poi.shared', 'Shared successfully!'));
      } else {
        await navigator.clipboard.writeText(window.location.href);
        success(t('poi.copiedLink', 'Link copied to clipboard!'));
      }
    } catch (err) {
      console.error('Error sharing POI:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-secondary">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-semibold mt-3">{t('common.loading', 'Loading details...')}</span>
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center text-danger">
        <p className="font-semibold">{error || t('poi.notFound', 'Food spot not found')}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all outline-none cursor-pointer"
        >
          {t('common.backHome', 'Back to map')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-16 text-text-primary">
      {/* Detail Top Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-full hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-extrabold text-sm tracking-tight text-center truncate max-w-[60vw]">
          {poi.name}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleBookmark}
            className={`p-1.5 rounded-full hover:bg-surface-alt transition-colors cursor-pointer outline-none ${
              isBookmarked ? 'text-danger' : 'text-text-secondary hover:text-text-primary'
            }`}
            title={isBookmarked ? 'Bỏ thích' : 'Thích'}
          >
            <Heart size={18} className={isBookmarked ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full hover:bg-surface-alt text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
        {/* Swiper Gallery */}
        <div className="w-full rounded-xl overflow-hidden shadow-md">
          <POIGallery images={poi.images || []} fallbackEmoji={poi.category[0] || '🍴'} />
        </div>

        {/* Info Card */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display font-extrabold text-xl tracking-tight text-text-primary leading-tight">
                {poi.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-[var(--radius-sm)] capitalize">
                  {poi.category}
                </span>
                
                {/* Rating */}
                <div className="flex items-center gap-0.5 text-primary text-xs font-bold">
                  <Star size={13} className="fill-current" />
                  <span>{poi.rating > 0 ? poi.rating.toFixed(1) : t('poi.new', 'New')}</span>
                  {poi.reviewCount > 0 && (
                    <span className="text-text-muted font-normal">({poi.reviewCount})</span>
                  )}
                </div>
              </div>
            </div>

            {/* Float Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={() => navigate(`/place/detail/quiz/${poi.id}`)}
                className="h-9 px-3.5 rounded-[var(--radius-md)] border border-border bg-card hover:bg-surface-alt font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none cursor-pointer"
              >
                <FileQuestion size={14} className="text-secondary-light" />
                <span>{t('poi.playQuiz', 'Thử thách')}</span>
              </button>
            </div>
          </div>

          {/* Audio Player Guide */}
          {poi.audioText && (
            <AudioPlayer
              poiId={poi.id}
              audioText={poi.audioText}
              languageCode={i18n.language}
              poiLanguageCode={poi.languageCode}
              autoPlay={fromQR}
            />
          )}
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-2">
          <h3 className="font-display font-bold text-sm uppercase text-text-secondary border-b border-border pb-1 tracking-wider">
            {t('poi.about', 'Giới thiệu')}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">
            {poi.fullDescription || poi.shortDescription}
          </p>
        </div>

        {/* Contact details */}
        <div className="flex flex-col gap-3 p-4 bg-surface-alt border border-border rounded-xl text-xs text-text-secondary">
          {poi.address && (
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
              <span className="leading-snug">{poi.address}</span>
            </div>
          )}

          {poi.phone && (
            <div className="flex items-center gap-2.5">
              <Phone size={15} className="text-primary shrink-0" />
              <a href={`tel:${poi.phone}`} className="hover:underline hover:text-primary transition-colors font-medium">
                {poi.phone}
              </a>
            </div>
          )}

          {poi.website && (
            <div className="flex items-center gap-2.5">
              <Globe size={15} className="text-primary shrink-0" />
              <a href={poi.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors font-medium truncate">
                {poi.website}
              </a>
            </div>
          )}
        </div>

        {/* Menu Items List */}
        {menuItems.length > 0 && (
          <div className="flex flex-col gap-3">
            <MenuList items={menuItems} />
          </div>
        )}

        {/* Operating Hours Section */}
        {((poi.operatingHours && poi.operatingHours.trim() !== '') && (() => {
          let parsedHours: OperatingHourItem[] | null = null;
          try {
            parsedHours = JSON.parse(poi.operatingHours);
          } catch {
            // Not JSON
          }
          const getDayName = (dayNum: number) => {
            const days = [
              t('days.sunday', 'Chủ Nhật'),
              t('days.monday', 'Thứ Hai'),
              t('days.tuesday', 'Thứ Ba'),
              t('days.wednesday', 'Thứ Tư'),
              t('days.thursday', 'Thứ Năm'),
              t('days.friday', 'Thứ Sáu'),
              t('days.saturday', 'Thứ Bảy')
            ];
            return days[dayNum];
          };
          return (
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-bold text-sm uppercase text-text-secondary border-b border-border pb-1 tracking-wider flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                <span>{t('poi.operatingHours', 'Giờ hoạt động')}</span>
              </h3>
              {parsedHours && Array.isArray(parsedHours) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 p-4 bg-surface-alt border border-border rounded-xl text-xs text-text-secondary">
                  {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                    const item = parsedHours!.find((h) => h.day === dayNum);
                    if (!item) return null;
                    return (
                      <div key={dayNum} className="flex justify-between py-1 border-b border-border/40 last:border-0 sm:[&:nth-last-child(-n+2)]:border-0">
                        <span className="font-semibold text-text-secondary">{getDayName(dayNum)}</span>
                        {item.closed ? (
                          <span className="text-danger font-medium">{t('owner.pois.closed', 'Đóng cửa')}</span>
                        ) : (
                          <span className="font-mono text-text-primary">{item.open} - {item.close}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-surface-alt border border-border rounded-xl text-xs text-text-secondary">
                  <p className="font-medium text-text-primary">{poi.operatingHours}</p>
                </div>
              )}
            </div>
          );
        })())}

        {/* Location Mini Map */}
        <div className="flex flex-col gap-2">
          <h3 className="font-display font-bold text-sm uppercase text-text-secondary border-b border-border pb-1 tracking-wider">
            {t('poi.location', 'Vị trí bản đồ')}
          </h3>
          <div className="h-64 rounded-xl overflow-hidden border border-border shadow-sm relative">
            <MapView>
              <POIMarker
                poi={poi}
                isSelected={true}
                onDetailClick={() => {}}
              />
            </MapView>
          </div>
          
          {/* External Navigation directions */}
          {poi.googleMapsUrl && (
            <a
              href={poi.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 h-10 w-full rounded-[var(--radius-md)] bg-primary text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-95 transition-all shadow-xs outline-none"
            >
              <Compass size={14} />
              <span>{t('poi.googleMapsDirections', 'Đường đi trên Google Maps')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
