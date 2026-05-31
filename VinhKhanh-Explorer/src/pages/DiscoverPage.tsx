import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, ChevronRight, SlidersHorizontal, Clock, Footprints, ArrowRight } from 'lucide-react';

import { api } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useLocationStore } from '../stores/locationStore';
import { computeHaversineDistance } from '../lib/utils';
import type { POIListDto, TourListDto } from '../types/poi';

const CATEGORIES = [
  { id: 'all', label_en: 'All', label_vi: 'Tất cả' },
  { id: 'restaurant', label_en: 'Restaurants', label_vi: 'Quán ăn' },
  { id: 'cafe', label_en: 'Cafes', label_vi: 'Cà phê' },
  { id: 'temple', label_en: 'Temples', label_vi: 'Đền chùa' },
  { id: 'market', label_en: 'Markets', label_vi: 'Chợ ẩm thực' },
  { id: 'park', label_en: 'Parks', label_vi: 'Công viên' },
  { id: 'landmark', label_en: 'Landmarks', label_vi: 'Di tích' },
  { id: 'street_art', label_en: 'Street Art', label_vi: 'Nghệ thuật' }
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const language = useSettingsStore((state) => state.language);
  const { position } = useLocationStore();
  
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState<'pois' | 'tours'>('pois');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'distance'>('default');

  // Fetch active POI list
  const { data: pois = [], isLoading } = useQuery<POIListDto[]>({
    queryKey: ['pois', language],
    queryFn: () => api.get<POIListDto[]>(`/pois?lang=${language}`),
  });

  // Fetch curated walking tours list
  const { data: tours = [], isLoading: isLoadingTours } = useQuery<TourListDto[]>({
    queryKey: ['tours', language],
    queryFn: () => api.get<TourListDto[]>(`/tours?lang=${language}`),
  });

  // Calculate distances and filter list
  const processedPOIs = useMemo(() => {
    let list = pois.map((poi) => {
      let distance: number | undefined;
      if (position) {
        distance = computeHaversineDistance(
          position.latitude,
          position.longitude,
          poi.latitude,
          poi.longitude
        );
      }
      return { ...poi, distance };
    });

    // Apply category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Apply search search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) => 
          p.name.toLowerCase().includes(q) || 
          p.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'distance' && position) {
      list.sort((a, b) => (a.distance ?? 999999) - (b.distance ?? 999999));
    }

    return list;
  }, [pois, selectedCategory, searchQuery, sortBy, position]);

  return (
    <div className="p-6 max-w-lg mx-auto text-white flex flex-col gap-5 min-h-[calc(100vh-64px)] pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-zinc-900 pb-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'vi' ? 'Khám phá Vĩnh Khánh' : 'Discover Vinh Khanh'}
        </h1>
        <p className="text-xs text-zinc-400">
          {language === 'vi' 
            ? 'Khám phá tinh hoa ẩm thực đường phố, di tích lịch sử và các địa điểm độc đáo.' 
            : 'Explore historical pagodas, classic local eateries, and unique street landmarks.'}
        </p>
      </div>

      {/* Segmented Control for POIs vs Tours */}
      <div className="flex bg-zinc-900/60 border border-zinc-850 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('pois')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pois'
              ? 'bg-zinc-850 text-emerald-400 border border-zinc-700/50 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {language === 'vi' ? '📍 Địa điểm tham quan' : '📍 Places & Eateries'}
        </button>
        <button
          onClick={() => setActiveTab('tours')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tours'
              ? 'bg-zinc-850 text-emerald-400 border border-zinc-700/50 shadow-md font-extrabold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          {language === 'vi' ? '🚶‍♂️ Tuyến đường đi bộ' : '🚶‍♂️ Walking Tours'}
        </button>
      </div>

      {activeTab === 'pois' ? (
        <>
          {/* Localized Search Bar */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-zinc-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm địa điểm, quán ăn...' : 'Search street food, cafes, temples...'}
              className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-850 rounded-2xl text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all text-white"
            />
          </div>

          {/* Category Horizontal Slider */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar scrollbar-none snap-x snap-mandatory">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all shrink-0 snap-align-start ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-bold'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {language === 'vi' ? cat.label_vi : cat.label_en}
              </button>
            ))}
          </div>

          {/* Sort controls */}
          {position && (
            <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/20 border border-zinc-900/30 px-3.5 py-2.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
                <span>{language === 'vi' ? 'Sắp xếp theo:' : 'Sort by:'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('default')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    sortBy === 'default' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-white'
                  }`}
                >
                  {language === 'vi' ? 'Mặc định' : 'Default'}
                </button>
                <button
                  onClick={() => setSortBy('distance')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                    sortBy === 'distance' ? 'text-emerald-400 bg-emerald-500/10' : 'hover:text-white'
                  }`}
                >
                  {language === 'vi' ? 'Khoảng cách' : 'Proximity'}
                </button>
              </div>
            </div>
          )}

          {/* Loader */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
              <div className="w-8 h-8 border-4 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading POIs...'}</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && processedPOIs.length === 0 && (
            <div className="text-center py-16 bg-zinc-900/10 border border-zinc-900/20 rounded-2xl p-6">
              <span className="text-3xl block mb-2">🔍</span>
              <h3 className="font-semibold text-zinc-300 mb-1">{language === 'vi' ? 'Không tìm thấy địa điểm' : 'No POIs found'}</h3>
              <p className="text-xs text-zinc-500">{language === 'vi' ? 'Hãy thử từ khóa khác hoặc lọc lại.' : 'Try adjusting filters or searching something else.'}</p>
            </div>
          )}

          {/* POI Cards List */}
          {!isLoading && processedPOIs.length > 0 && (
            <div className="flex flex-col gap-3">
              {processedPOIs.map((poi) => (
                <Link
                  to={`/poi/${poi.id}`}
                  key={poi.id}
                  className="flex gap-4 p-4 rounded-2xl border border-zinc-900 bg-zinc-900/35 hover:border-zinc-800/80 hover:bg-zinc-900/50 transition-all text-left shadow group"
                >
                  {poi.imageUrl ? (
                    <img
                      src={poi.imageUrl}
                      alt={poi.name}
                      className="w-20 h-20 object-cover rounded-xl border border-zinc-900/60 shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                      <span className="text-xl">📍</span>
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                        {poi.category}
                      </span>
                      {poi.distance !== undefined && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-zinc-400">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          {poi.distance < 1000 
                            ? `${Math.round(poi.distance)}m` 
                            : `${(poi.distance / 1000).toFixed(1)}km`}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                      {poi.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {poi.category === 'restaurant' 
                        ? (language === 'vi' ? 'Quán ăn đường phố nổi bật phục vụ du khách.' : 'Traditional street food diner serving generational specialties.')
                        : (language === 'vi' ? 'Điểm tham quan thu hút độc đáo tại phố đi bộ.' : 'Iconic cultural sightseeing landmark worth visiting.')}
                    </p>
                  </div>

                  <div className="flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors pl-2">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Curated Walking Tours List */
        <>
          {isLoadingTours && (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-500">
              <div className="w-8 h-8 border-4 border-t-emerald-500 border-zinc-800 rounded-full animate-spin"></div>
              <span className="text-xs font-semibold">{language === 'vi' ? 'Đang tải danh sách tuyến đường...' : 'Loading curated tours...'}</span>
            </div>
          )}

          {!isLoadingTours && tours.length === 0 && (
            <div className="text-center py-16 bg-zinc-900/10 border border-zinc-900/20 rounded-2xl p-6">
              <span className="text-3xl block mb-2">🧭</span>
              <h3 className="font-semibold text-zinc-300 mb-1">{language === 'vi' ? 'Không tìm thấy tuyến đường' : 'No curated tours found'}</h3>
              <p className="text-xs text-zinc-500">{language === 'vi' ? 'Các tuyến đường đi bộ đặc sắc sẽ sớm được ra mắt.' : 'Curated walking paths and food expeditions will appear here shortly.'}</p>
            </div>
          )}

          {!isLoadingTours && tours.length > 0 && (
            <div className="flex flex-col gap-4">
              {tours.map((tour) => (
                <div
                  key={tour.id}
                  className="flex flex-col gap-4 p-5 rounded-2xl border border-zinc-900 bg-zinc-900/35 hover:border-zinc-800/80 transition-all text-left shadow-lg"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-base text-zinc-100">
                      {tour.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
                      {tour.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-900 pt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {tour.stopCount} {language === 'vi' ? 'điểm dừng' : 'stops'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>
                        {tour.estimatedMinutes} {language === 'vi' ? 'phút' : 'mins'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {tour.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/explore?tour=${tour.id}`)}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-extrabold rounded-xl transition-all shadow-md active:scale-[0.98] group"
                  >
                    <span>{language === 'vi' ? 'Bắt Đầu Hành Trình' : 'Start Walking Tour'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
