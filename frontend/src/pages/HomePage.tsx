import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, List, Navigation, ChevronRight, ChevronDown, Clock } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Modal from '@/components/ui/Modal';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import MapView from '@/components/map/MapView';
import POIMarker from '@/components/map/POIMarker';
import TourLayer from '@/components/map/TourLayer';
import DirectionLayer from '@/components/map/DirectionLayer';
import UserLocation from '@/components/map/UserLocation';
import POICard from '@/components/poi/POICard';
import POIDetail from '@/components/poi/POIDetail';
import FilterPanel from '@/components/search/FilterPanel';
import { usePOIs } from '@/hooks/usePOIs';
import { useTours } from '@/hooks/useTours';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMapbox } from '@/hooks/useMapbox';
import { useFavorites } from '@/hooks/useFavorites';
import { useVisitor } from '@/contexts/VisitorContext';
import { useAuth } from '@/contexts/AuthContext';

// Helper to calculate distance in meters using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  ];
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setLangMenuOpen(false);
  };

  const isVi = i18n.language === 'vi';

  // Custom Hooks
  const { position: realPosition } = useGeolocation();
  const [simulatedPosition, setSimulatedPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const position = simulatedPosition || realPosition;
  const [isTourCompletedModalOpen, setIsTourCompletedModalOpen] = useState(false);
  const [isTourPanelCollapsed, setIsTourPanelCollapsed] = useState(false);
  const tourCollapseTimeoutRef = useRef<any>(null);
  const [isPositionPanelCollapsed, setIsPositionPanelCollapsed] = useState(false);
  const positionCollapseTimeoutRef = useRef<any>(null);
  const { pois, loading: poisLoading, fetchPOIs } = usePOIs();
  const { tours, selectedTour, loading: toursLoading, fetchTours, fetchTourById, setSelectedTour } = useTours();
  const { flyTo } = useMapbox();
  const { favorites, toggleFavorite } = useFavorites();
  const { isActivated, expiresAt, loading: visitorLoading } = useVisitor();
  const { isAuthenticated } = useAuth();

  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    if (!isActivated || !expiresAt) {
      setTimeLeftStr('');
      return;
    }

    const updateTimer = () => {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeLeftStr('Hết hạn');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeftStr(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeftStr(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeftStr(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isActivated, expiresAt]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState<boolean>(false);

  const handleNearbyToggle = (show: boolean) => {
    if (show && !position) {
      alert(t('map.locationRequired', 'Please enable GPS/location services to use this feature.'));
      return;
    }
    setShowNearbyOnly(show);
  };

  const handleSortChange = (sort: string) => {
    if (sort === 'distance' && !position) {
      alert(t('map.locationRequired', 'Please enable GPS/location services to use this feature.'));
      return;
    }
    setSortBy(sort);
  };

  // Selection states — two separate: popup (marker highlight) vs detail sheet
  const [popupPoiId, setPopupPoiId] = useState<number | null>(null);
  const [detailPoiId, setDetailPoiId] = useState<number | null>(null);
  const [detailSnap, setDetailSnap] = useState<'mini' | 'full'>('mini');
  const [activeTourStopIndex, setActiveTourStopIndex] = useState<number | null>(null);

  // Directions state
  const [showDirections, setShowDirections] = useState(false);
  const [directionsDest, setDirectionsDest] = useState<[number, number] | null>(null);

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine Tab mode based on Path
  const currentTab = useMemo(() => {
    if (path.startsWith('/pois') || path.startsWith('/list')) return 'list';
    if (path.startsWith('/tours')) return 'tours';
    return 'map'; // Root /
  }, [path]);

  // Load Initial Data
  useEffect(() => {
    fetchPOIs();
    fetchTours();

    const handlePoiUpdated = () => {
      fetchPOIs(undefined, true);
    };

    window.addEventListener('poi-updated', handlePoiUpdated);
    return () => window.removeEventListener('poi-updated', handlePoiUpdated);
  }, [fetchPOIs, fetchTours]);

  // Computed POIs with distances based on GPS position
  const poisWithDistance = useMemo(() => {
    return pois.map((poi) => {
      let distance = poi.distanceMeters;
      if ((distance === undefined || distance === null) && position) {
        distance = getDistance(position.latitude, position.longitude, poi.latitude, poi.longitude);
      }
      return {
        ...poi,
        distanceMeters: distance,
        isFavorite: favorites.includes(poi.id),
      };
    });
  }, [pois, position, favorites]);

  // Filtered & Sorted POIs
  const filteredPOIs = useMemo(() => {
    let result = poisWithDistance.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory ? item.category.toLowerCase() === selectedCategory.toLowerCase() : true;
      
      const matchesPrice = priceFilter ? item.priceRange === priceFilter : true;
      
      const matchesFavorite = showFavoritesOnly ? item.isFavorite : true;
      
      const matchesNearby = showNearbyOnly ? (item.distanceMeters !== undefined && item.distanceMeters !== null && item.distanceMeters < 1000) : true;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesFavorite && matchesNearby;
    });

    // Sorting
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'distance') {
      result.sort((a, b) => {
        const distA = a.distanceMeters ?? 999999;
        const distB = b.distanceMeters ?? 999999;
        return distA - distB;
      });
    }

    return result;
  }, [poisWithDistance, searchQuery, selectedCategory, priceFilter, showFavoritesOnly, showNearbyOnly, sortBy]);

  // Handle POI selection from marker click or list card click
  // — only opens the popup, NOT the detail sheet
  const handleSelectPoi = (poiId: number, lat: number, lng: number) => {
    setPopupPoiId(poiId);
    flyTo([lng, lat], 17);
    // On mobile list view, switch to map so user can see the popup
    if (currentTab === 'list') {
      navigate('/');
    }
  };

  // Handle "View Details" button in popup — opens the detail sheet
  const handleOpenDetail = (poiId: number, lat: number, lng: number, fromPopup = false) => {
    setDetailPoiId(poiId);
    if (fromPopup) {
      setDetailSnap('full');
      setPopupPoiId(null); // Close the Mapbox popup panel/bubble
    } else {
      setDetailSnap('mini');
    }
    // Slight offset so sheet doesn't cover the marker
    flyTo([lng, lat], 17);
    if (currentTab === 'list') navigate('/');
  };

  // Handle Tour Selection
  const handleSelectTour = async (tourId: number) => {
    const tourDetail = await fetchTourById(tourId);
    if (tourDetail && tourDetail.stops.length > 0) {
      const firstStop = tourDetail.stops[0];
      setActiveTourStopIndex(0);
      flyTo([firstStop.longitude, firstStop.latitude], 16);
      setPopupPoiId(firstStop.poiId);
      navigate('/');
    }
  };

  // Close Tour line
  const handleCloseTour = () => {
    setSelectedTour(null);
    setActiveTourStopIndex(null);
  };

  // Set up Directions
  const handleStartDirections = (poi: any) => {
    if (position) {
      setDirectionsDest([poi.longitude, poi.latitude]);
      setShowDirections(true);
      flyTo([poi.longitude, poi.latitude], 16);
    } else {
      alert(t('map.locationRequired', 'Please enable GPS/location services to get directions.'));
    }
  };

  // Disable Directions
  const handleCloseDirections = () => {
    setShowDirections(false);
    setDirectionsDest(null);
  };

  // Sync navigation/directions with active tour stop
  useEffect(() => {
    if (selectedTour && activeTourStopIndex !== null) {
      const sortedStops = [...selectedTour.stops].sort((a, b) => a.stopOrder - b.stopOrder);
      const activeStop = sortedStops[activeTourStopIndex];
      if (activeStop) {
        setDirectionsDest([activeStop.longitude, activeStop.latitude]);
        setShowDirections(true);
      }
    } else if (!selectedTour) {
      // Clear directions when tour is closed
      setShowDirections(false);
      setDirectionsDest(null);
      setSimulatedPosition(null);
    }
  }, [selectedTour, activeTourStopIndex]);

  // Auto-advance active tour stop when user arrives near the current stop
  useEffect(() => {
    if (position && selectedTour && activeTourStopIndex !== null) {
      const sortedStops = [...selectedTour.stops].sort((a, b) => a.stopOrder - b.stopOrder);
      const activeStop = sortedStops[activeTourStopIndex];
      if (activeStop) {
        const dist = getDistance(
          position.latitude,
          position.longitude,
          activeStop.latitude,
          activeStop.longitude
        );
        // If user is within 25 meters, advance to the next stop
        if (dist < 25) {
          if (activeTourStopIndex < sortedStops.length - 1) {
            setActiveTourStopIndex(activeTourStopIndex + 1);
            const nextStop = sortedStops[activeTourStopIndex + 1];
            flyTo([nextStop.longitude, nextStop.latitude], 16.5);
            setPopupPoiId(nextStop.poiId);
          } else if (!isTourCompletedModalOpen) {
            console.log('Tour completed! All stops visited.');
            setIsTourCompletedModalOpen(true);
          }
        }
      }
    }
  }, [position, selectedTour, activeTourStopIndex, isTourCompletedModalOpen]);

  // Auto-collapse Active Tour panel after 5 seconds of selection or stop change
  useEffect(() => {
    if (selectedTour) {
      setIsTourPanelCollapsed(false);

      if (tourCollapseTimeoutRef.current) {
        clearTimeout(tourCollapseTimeoutRef.current);
      }

      tourCollapseTimeoutRef.current = setTimeout(() => {
        setIsTourPanelCollapsed(true);
      }, 5000);
    } else {
      setIsTourPanelCollapsed(false);
    }

    return () => {
      if (tourCollapseTimeoutRef.current) {
        clearTimeout(tourCollapseTimeoutRef.current);
      }
    };
  }, [selectedTour, activeTourStopIndex]);

  // Auto-collapse Position panel after 5 seconds of selection or simulated position change
  useEffect(() => {
    if (selectedTour) {
      setIsPositionPanelCollapsed(false);

      if (positionCollapseTimeoutRef.current) {
        clearTimeout(positionCollapseTimeoutRef.current);
      }

      positionCollapseTimeoutRef.current = setTimeout(() => {
        setIsPositionPanelCollapsed(true);
      }, 5000);
    } else {
      setIsPositionPanelCollapsed(false);
    }

    return () => {
      if (positionCollapseTimeoutRef.current) {
        clearTimeout(positionCollapseTimeoutRef.current);
      }
    };
  }, [selectedTour, simulatedPosition]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-text-primary">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={currentTab !== 'tours'}
      />

      <div className="flex-1 flex relative overflow-hidden">
        {/* SIDEBAR - Desktop and Tablet drawer */}
        <aside className="hidden md:flex flex-col md:w-72 lg:w-96 border-r border-border bg-card shrink-0 z-10 overflow-hidden">
          {/* Tabs header inside Sidebar */}
          <div className="flex border-b border-border">
            <button
              onClick={() => {
                navigate('/');
                handleCloseTour();
              }}
              className={`flex-1 py-3.5 text-sm font-display font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer outline-none ${
                currentTab !== 'tours'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <List size={16} />
              <span>{t('nav.list', 'Food Spots')}</span>
            </button>
            <button
              onClick={() => navigate('/tours')}
              className={`flex-1 py-3.5 text-sm font-display font-extrabold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer outline-none ${
                currentTab === 'tours'
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Compass size={16} />
              <span>{t('nav.tours', 'Food Tours')}</span>
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {currentTab === 'tours' ? (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
                {selectedTour ? (
                  /* Active Tour Details Panel */
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <h3 className="font-display font-extrabold text-base text-primary">
                        {selectedTour.name}
                      </h3>
                      <button
                        onClick={handleCloseTour}
                        className="text-xs font-semibold text-text-secondary hover:text-text-primary underline cursor-pointer outline-none"
                      >
                        {t('common.back', 'Tất cả Tours')}
                      </button>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {selectedTour.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-semibold text-text-muted">
                      <span>⏱️ {selectedTour.estimatedMinutes} {t('tours.mins', 'mins')}</span>
                      <span>📏 {selectedTour.distanceKm} km</span>
                      <span>📍 {selectedTour.stops.length} {t('tours.stops', 'stops')}</span>
                    </div>

                    {/* Stops List */}
                    <div className="flex flex-col gap-2 mt-2">
                      <h4 className="font-display font-bold text-xs uppercase text-text-secondary tracking-wider">
                        {t('tours.itinerary', 'Lịch trình điểm dừng')}
                      </h4>
                      {selectedTour.stops
                        .sort((a, b) => a.stopOrder - b.stopOrder)
                        .map((stop, index) => {
                          const isActive = activeTourStopIndex === index;
                          return (
                            <div
                              key={stop.id}
                              onClick={() => {
                                setActiveTourStopIndex(index);
                                flyTo([stop.longitude, stop.latitude], 17);
                                setPopupPoiId(stop.poiId);
                              }}
                              className={`flex items-start gap-3 p-2.5 rounded-[var(--radius-md)] border cursor-pointer select-none transition-all ${
                                isActive
                                  ? 'bg-primary/5 border-primary shadow-xs'
                                  : 'bg-surface-alt border-border hover:border-border-hover'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-display font-bold text-[10px] border ${
                                  isActive
                                    ? 'bg-primary text-white border-white shadow-xs'
                                    : 'bg-card text-text-secondary border-border'
                                }`}
                              >
                                {stop.stopOrder}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-xs text-text-primary leading-tight line-clamp-1">
                                  {stop.poiName}
                                </h5>
                                <p className="text-[10px] text-text-muted line-clamp-1 mt-0.5">
                                  {stop.poiCategory} • {stop.poiShortDescription}
                                </p>
                                {stop.transitionNote && (
                                  <p className="text-[10px] text-primary italic font-medium mt-1 leading-snug">
                                    💡 {stop.transitionNote}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  /* Tours Selection List */
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {t('tours.guide', 'Chọn một tour đi bộ ẩm thực được lên lịch sẵn để khám phá con phố ẩm thực theo lộ trình tối ưu.')}
                    </p>
                    {toursLoading && (
                      <div className="text-center py-8 text-xs font-semibold text-text-muted animate-pulse">
                        {t('common.loading', 'Loading tours...')}
                      </div>
                    )}
                    {!toursLoading && tours.map((tour) => (
                      <div
                        key={tour.id}
                        onClick={() => handleSelectTour(tour.id)}
                        className="p-3 bg-surface-alt border border-border hover:border-border-hover hover:shadow-xs rounded-[var(--radius-lg)] cursor-pointer transition-all flex flex-col gap-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display font-extrabold text-sm text-text-primary hover:text-primary transition-colors leading-tight">
                            {tour.name}
                          </h4>
                          <ChevronRight size={16} className="text-text-muted shrink-0 mt-0.5" />
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                          {tour.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-text-muted pt-1">
                          <span>⏱️ {tour.estimatedMinutes}m</span>
                          <span>📏 {tour.distanceKm}km</span>
                          <span>📍 {tour.stopCount} stops</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* --- FOOD SPOTS LIST TAB --- */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Horizontal Category Chips - Sticky at the top */}
                <div className="px-4 bg-card shrink-0 z-10 border-b border-border/60 shadow-xs">
                  <FilterPanel
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    selectedPrice={priceFilter}
                    onPriceChange={setPriceFilter}
                    sortBy={sortBy}
                    onSortByChange={handleSortChange}
                    showFavoritesOnly={showFavoritesOnly}
                    onShowFavoritesOnlyChange={setShowFavoritesOnly}
                    showNearbyOnly={showNearbyOnly}
                    onShowNearbyOnlyChange={handleNearbyToggle}
                  />
                </div>

                {/* Scrollable list of cards */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
                  {poisLoading && (
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-[var(--radius-lg)] bg-surface-alt border border-border animate-pulse shrink-0" />
                      ))}
                    </div>
                  )}

                  {!poisLoading && filteredPOIs.length === 0 && (
                    <div className="text-center py-12 px-4 text-text-muted text-xs">
                      {showNearbyOnly
                        ? t('search.noNearbyResults', 'Không có quán nào trong phạm vi 1km xung quanh vị trí của bạn. Hãy thử tắt bộ lọc hoặc di chuyển đến gần phố ẩm thực hơn.')
                        : t('search.noResults', 'Không tìm thấy quán nào phù hợp với bộ lọc.')}
                    </div>
                  )}

                  {!poisLoading && filteredPOIs.map((poi) => (
                    <POICard
                      key={poi.id}
                      poi={poi}
                      onClick={() => handleSelectPoi(poi.id, poi.latitude, poi.longitude)}
                      onToggleFavorite={(id) => toggleFavorite(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAP CONTAINER - Full screen */}
        <main className="flex-1 h-full relative">
          <MapView onMapClick={(lngLat) => {
            console.log('HomePage onMapClick triggered with:', lngLat);
            setSimulatedPosition((prev) => {
              console.log('HomePage setSimulatedPosition updater. Current prev:', prev);
              if (prev !== null) {
                return {
                  latitude: lngLat[1],
                  longitude: lngLat[0],
                };
              }
              return null;
            });
          }}>
            {/* User GPS Dot */}
            <UserLocation overridePosition={position} />

            {/* Render POIs markers */}
            {filteredPOIs.map((poi) => (
              <POIMarker
                key={poi.id}
                poi={poi}
                isSelected={popupPoiId === poi.id}
                onClick={() => handleSelectPoi(poi.id, poi.latitude, poi.longitude)}
                onDetailClick={(p) => handleOpenDetail(p.id, p.latitude, p.longitude, true)}
              />
            ))}

            {/* Tour stops line path */}
            {selectedTour && (
              <TourLayer
                tour={selectedTour}
                activeStopIndex={activeTourStopIndex}
                onStopClick={(stop) => {
                  const idx = selectedTour.stops.findIndex((s) => s.id === stop.id);
                  setActiveTourStopIndex(idx);
                  setPopupPoiId(stop.poiId);
                }}
              />
            )}

            {/* Walking routing directions overlay */}
            {showDirections && position && directionsDest && (
              <DirectionLayer
                origin={[position.longitude, position.latitude]}
                destination={directionsDest}
              />
            )}
          </MapView>

          {/* Floating Map overlays container - Bottom Left */}
          <div className="absolute bottom-20 left-4 md:bottom-6 md:left-4 z-10 flex flex-col gap-2.5 max-w-[calc(100vw-32px)] md:max-w-sm pointer-events-none">
            {/* Active time remaining for visitors */}
            {!isAuthenticated && isActivated && timeLeftStr && (
              <div className="pointer-events-auto flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] bg-card/95 backdrop-blur-xs border border-border text-teal-600 dark:text-teal-400 text-xs font-semibold select-none shadow-md w-fit animate-slide-in-top">
                <Clock size={13} className="text-teal-500 animate-pulse" />
                <span>{isVi ? 'Còn lại: ' : 'Remaining: '}</span>
                <strong className="font-mono">{timeLeftStr}</strong>
              </div>
            )}

            {/* Simulation Location Control */}
            {selectedTour && (
              <div
                onClick={() => {
                  if (isPositionPanelCollapsed) {
                    setIsPositionPanelCollapsed(false);
                    // Re-start 5s collapse timer
                    if (positionCollapseTimeoutRef.current) clearTimeout(positionCollapseTimeoutRef.current);
                    positionCollapseTimeoutRef.current = setTimeout(() => {
                      setIsPositionPanelCollapsed(true);
                    }, 5000);
                  }
                }}
                className={`pointer-events-auto bg-card/95 backdrop-blur-xs border border-border shadow-lg transition-all duration-300 ease-in-out cursor-pointer flex items-center overflow-hidden h-12 ${
                  isPositionPanelCollapsed
                    ? 'w-12 rounded-full justify-center p-0 hover:bg-surface-alt'
                    : 'w-80 max-w-[calc(100vw-32px)] px-3 py-2 justify-between rounded-[var(--radius-lg)]'
                }`}
                title={isPositionPanelCollapsed ? (isVi ? 'Nhấp để cấu hình định vị' : 'Click to configure positioning') : undefined}
              >
                {/* Collapsed View: Pulsing GPS / Simulated dot */}
                <div
                  className={`flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isPositionPanelCollapsed
                      ? 'opacity-100 scale-100 w-12 h-12'
                      : 'opacity-0 scale-75 w-0 h-0 pointer-events-none overflow-hidden'
                  }`}
                >
                  <div className="relative flex items-center justify-center w-8 h-8">
                    <div className={`absolute w-5 h-5 rounded-full animate-ping ${
                      simulatedPosition ? 'bg-amber-500/35' : 'bg-teal-500/35'
                    }`} />
                    <div className={`relative w-3.5 h-3.5 border-2 border-white rounded-full shadow-md ${
                      simulatedPosition ? 'bg-amber-500' : 'bg-teal-500'
                    }`} />
                  </div>
                </div>

                {/* Expanded Content: Faded out when collapsed */}
                <div
                  className={`flex items-center justify-between shrink-0 transition-all duration-300 ${
                    isPositionPanelCollapsed 
                      ? 'opacity-0 w-0 pointer-events-none overflow-hidden' 
                      : 'opacity-100 w-[294px] max-w-[calc(100vw-58px)]'
                  }`}
                >
                  <span className="font-semibold text-text-secondary flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 animate-ping ${
                      simulatedPosition ? 'bg-amber-500' : 'bg-teal-500'
                    }`} />
                    <span className="truncate text-[10px]">
                      {simulatedPosition ? (isVi ? 'Giả lập (Click bản đồ để đi)' : 'Simulated (Click map to walk)') : (isVi ? 'Vị trí: GPS thật' : 'Position: Real GPS')}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (simulatedPosition) {
                          setSimulatedPosition(null);
                        } else {
                          const sortedStops = [...selectedTour.stops].sort((a, b) => a.stopOrder - b.stopOrder);
                          const firstStop = sortedStops[activeTourStopIndex || 0];
                          if (firstStop) {
                            setSimulatedPosition({
                              latitude: firstStop.latitude - 0.0005,
                              longitude: firstStop.longitude - 0.0005,
                            });
                            flyTo([firstStop.longitude - 0.0005, firstStop.latitude - 0.0005], 16.5);
                          }
                        }
                      }}
                      className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors cursor-pointer shrink-0 leading-none h-7 flex items-center justify-center text-[10px]"
                    >
                      {simulatedPosition ? (isVi ? 'Tắt' : 'Disable') : (isVi ? 'Giả lập' : 'Simulate')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPositionPanelCollapsed(true);
                        if (positionCollapseTimeoutRef.current) clearTimeout(positionCollapseTimeoutRef.current);
                      }}
                      className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-alt transition-colors shrink-0"
                      title={isVi ? 'Thu gọn' : 'Collapse'}
                    >
                      <ChevronDown size={14} className="rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Tour indicator */}
            {selectedTour && (
              <div
                onClick={() => {
                  if (isTourPanelCollapsed) {
                    setIsTourPanelCollapsed(false);
                    // Re-start 5s collapse timer
                    if (tourCollapseTimeoutRef.current) clearTimeout(tourCollapseTimeoutRef.current);
                    tourCollapseTimeoutRef.current = setTimeout(() => {
                      setIsTourPanelCollapsed(true);
                    }, 5000);
                  }
                }}
                className={`pointer-events-auto bg-card/95 backdrop-blur-xs border border-border shadow-lg transition-all duration-300 ease-in-out cursor-pointer flex items-center overflow-hidden h-12 ${
                  isTourPanelCollapsed
                    ? 'w-12 rounded-full justify-center p-0 hover:bg-surface-alt'
                    : 'w-80 max-w-[calc(100vw-32px)] px-3 py-2 justify-between rounded-[var(--radius-lg)]'
                }`}
                title={isTourPanelCollapsed ? (isVi ? 'Nhấp để mở rộng bảng Tour' : 'Click to expand Tour panel') : undefined}
              >
                {/* Collapsed View: Pulsing compass icon */}
                <div
                  className={`flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isTourPanelCollapsed
                      ? 'opacity-100 scale-100 w-12 h-12'
                      : 'opacity-0 scale-75 w-0 h-0 pointer-events-none overflow-hidden'
                  }`}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 animate-pulse">
                    <Compass size={16} />
                  </div>
                </div>

                {/* Expanded Content: Faded out when collapsed */}
                <div
                  className={`flex items-center justify-between shrink-0 transition-all duration-300 ${
                    isTourPanelCollapsed 
                      ? 'opacity-0 w-0 pointer-events-none overflow-hidden' 
                      : 'opacity-100 w-[294px] max-w-[calc(100vw-58px)]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="text-[9px] uppercase font-bold text-primary tracking-wider font-display font-extrabold">Active Tour</span>
                      <span className="text-[9px] text-text-muted">• {(activeTourStopIndex ?? 0) + 1}/{selectedTour.stops.length}</span>
                    </div>
                    <h4 className="font-display font-extrabold text-xs text-text-primary leading-tight line-clamp-1 mt-0.5">{selectedTour.name}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseTour();
                      }}
                      className="text-[10px] font-bold px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-md transition-colors cursor-pointer outline-none shrink-0"
                    >
                      {isVi ? 'Dừng' : 'End'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTourPanelCollapsed(true);
                        if (tourCollapseTimeoutRef.current) clearTimeout(tourCollapseTimeoutRef.current);
                      }}
                      className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-alt transition-colors shrink-0"
                      title={isVi ? 'Thu gọn' : 'Collapse'}
                    >
                      <ChevronDown size={14} className="rotate-90" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Directions active bar */}
            {showDirections && !selectedTour && (
              <div className="pointer-events-auto bg-card/95 backdrop-blur-xs border border-teal-600/30 p-3 rounded-[var(--radius-lg)] shadow-lg flex items-center justify-between gap-4 animate-slide-in-top">
                <div className="min-w-0 flex items-center gap-2">
                  <Navigation size={18} className="text-teal-600 fill-current" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-teal-600 tracking-wider font-display">Walking Navigation</span>
                    <h4 className="font-display font-bold text-xs text-text-primary leading-tight">Drawing optimal route...</h4>
                  </div>
                </div>
                <button
                  onClick={handleCloseDirections}
                  className="text-xs font-semibold px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-md hover:bg-teal-100 transition-colors cursor-pointer outline-none shrink-0"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </main>

        {/* POI Detail Sheet — mobile bottom sheet / desktop right sidebar */}
        {detailPoiId && (!isMobile || currentTab === 'map') && (
          <POIDetail
            poiId={detailPoiId}
            initialSnap={detailSnap}
            onClose={() => setDetailPoiId(null)}
            onShowDirections={handleStartDirections}
            onStartQuiz={(poiId) => navigate(`/place/detail/quiz/${poiId}`)}
          />
        )}
      </div>

      {/* MOBILE ONLY - Bottom sheets and lists for navigation tabs */}
      {currentTab === 'list' && (
        <div className="md:hidden fixed inset-x-0 bottom-16 top-16 bg-surface z-35 flex flex-col overflow-hidden animate-slide-in-top">
          {/* Header containing FilterPanel */}
          <div className="px-4 bg-card border-b border-border/60 shrink-0">
            <FilterPanel
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPrice={priceFilter}
              onPriceChange={setPriceFilter}
              sortBy={sortBy}
              onSortByChange={handleSortChange}
              showFavoritesOnly={showFavoritesOnly}
              onShowFavoritesOnlyChange={setShowFavoritesOnly}
              showNearbyOnly={showNearbyOnly}
              onShowNearbyOnlyChange={handleNearbyToggle}
            />
          </div>

          {/* Scrollable Food Spots cards */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24 scrollbar-thin">
            {poisLoading ? (
              <div className="text-center py-12 text-xs font-semibold text-text-muted animate-pulse">{t('common.loading', 'Loading...')}</div>
            ) : filteredPOIs.length === 0 ? (
              <div className="text-center py-12 px-4 text-text-muted text-xs">
                {showNearbyOnly
                  ? t('search.noNearbyResults', 'Không có quán nào trong phạm vi 1km xung quanh vị trí của bạn. Hãy thử tắt bộ lọc hoặc di chuyển đến gần phố ẩm thực hơn.')
                  : t('search.noResults', 'Không tìm thấy quán nào phù hợp với bộ lọc.')}
              </div>
            ) : (
              filteredPOIs.map((poi) => (
                <POICard
                  key={poi.id}
                  poi={poi}
                  onClick={() => handleSelectPoi(poi.id, poi.latitude, poi.longitude)}
                  onToggleFavorite={(id) => toggleFavorite(id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {currentTab === 'tours' && (
        <div className="md:hidden fixed inset-x-0 bottom-16 top-16 bg-surface z-35 flex flex-col p-4 overflow-y-auto animate-slide-in-top">
          <div className="flex flex-col gap-3 pb-20">
            {selectedTour ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-display font-extrabold text-sm text-primary">{selectedTour.name}</h3>
                  <button onClick={handleCloseTour} className="text-xs font-semibold text-text-secondary underline">All Tours</button>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {selectedTour.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      onClick={() => {
                        setActiveTourStopIndex(index);
                        setPopupPoiId(stop.poiId);
                        flyTo([stop.longitude, stop.latitude], 16.5);
                        navigate('/');
                      }}
                      className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg"
                    >
                      <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-primary text-white font-display font-bold text-[10px] border border-white">
                        {stop.stopOrder}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-text-primary">{stop.poiName}</h4>
                        <p className="text-[10px] text-text-muted mt-0.5">{stop.poiCategory}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-text-secondary leading-relaxed mb-2">
                  {t('tours.guide', 'Chọn một tour đi bộ ẩm thực được lên lịch sẵn để khám phá con phố ẩm thực theo lộ trình tối ưu.')}
                </p>
                {toursLoading ? (
                  <div className="text-center py-12 text-xs font-semibold text-text-muted animate-pulse">Loading...</div>
                ) : (
                  tours.map((tour) => (
                    <div
                      key={tour.id}
                      onClick={() => {
                        handleSelectTour(tour.id);
                        navigate('/');
                      }}
                      className="p-3 bg-card border border-border rounded-[var(--radius-lg)] flex flex-col gap-1"
                    >
                      <h4 className="font-display font-extrabold text-sm text-text-primary leading-tight">{tour.name}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2">{tour.description}</p>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted pt-1">
                        <span>⏱️ {tour.estimatedMinutes}m</span>
                        <span>📏 {tour.distanceKm}km</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Welcome & Activation Lock Screen */}
      {!isActivated && !visitorLoading && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-md p-6 text-center select-none animate-fade-in">
          
          {/* Floating Theme & Language Switcher */}
          <div className="absolute top-6 right-6 flex items-center gap-3 z-55">
            <ThemeToggle className="bg-card shadow-md border border-border" />
            
            {/* Custom Language Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] text-sm font-medium border border-border cursor-pointer bg-card text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors select-none outline-none shadow-md"
              >
                <span className="text-base" role="img" aria-hidden="true">
                  {currentLang.flag}
                </span>
                <span className="hidden sm:inline">{currentLang.label}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 text-text-muted ${langMenuOpen ? 'rotate-180 text-primary' : ''}`}
                />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-[var(--radius-md)] border border-border bg-card shadow-lg py-1 z-60 animate-slide-in-top origin-top-right">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => selectLanguage(lang.code)}
                      className={`flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm font-medium cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors outline-none ${lang.code === i18n.language ? 'text-primary bg-primary/5 font-semibold' : ''}`}
                    >
                      <span className="text-base" role="img" aria-hidden="true">
                        {lang.flag}
                      </span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl shadow-2xl p-8 md:p-10 flex flex-col items-center gap-6 relative overflow-hidden">
            {/* Decorative layout highlights */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-accent/10 rounded-full blur-2xl" />

            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
              <Compass size={32} className="animate-spin-slow" />
            </div>

            <div className="flex flex-col gap-2.5">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-text-primary tracking-tight leading-tight">
                {isVi ? 'Khám Phá Bản Đồ Ẩm Thực' : 'Explore Street Food Map'}
              </h2>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-sm">
                {isVi 
                  ? 'Chào mừng du khách! Bản đồ ẩm thực với thuyết minh âm thanh đa ngôn ngữ (22 thứ tiếng) và câu hỏi trắc nghiệm tương tác đang chờ đón bạn.'
                  : 'Welcome visitors! Discover street food maps with multi-language audio guides (22 languages) and interactive quizzes.'}
              </p>
            </div>

            <div className="w-full p-4 bg-surface-alt border border-border/50 rounded-2xl text-left flex flex-col gap-3">
              <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider">
                {isVi ? 'Cách kích hoạt:' : 'How to activate:'}
              </h4>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                <p className="text-xs text-text-secondary">
                  {isVi ? 'Quét mã QR tại các quán ăn trong phố cổ.' : 'Scan QR codes at food spots in the old town.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                <p className="text-xs text-text-secondary">
                  {isVi 
                    ? 'Thanh toán phí kích hoạt nhỏ (20.000đ) qua cổng giả lập để mở khóa toàn bộ bản đồ.'
                    : 'Pay a small activation fee (20,000 VND) via our test gateway to unlock the full map.'}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                <p className="text-xs text-text-secondary">
                  {isVi ? 'Tận hưởng bản đồ không giới hạn trong 24 giờ!' : 'Enjoy unlimited map features for 24 hours!'}
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3.5 mt-2">
              <button
                onClick={() => navigate('/activate')}
                className="w-full h-11 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isVi ? 'Nhập thẻ kích hoạt trực tiếp (20.000đ)' : 'Enter activation card directly (20,000 VND)'}</span>
                <ChevronRight size={14} />
              </button>
              <div className="text-[10px] text-text-muted">
                {isVi ? 'Hoặc quét mã QR được dán tại các Food Spot để bắt đầu.' : 'Or scan the QR code posted at Food Spots to start.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/owner/login')}
            className="mt-6 px-6 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border-none outline-none"
          >
            {isVi ? 'Đăng nhập / Đăng ký đối tác' : 'Partner Login / Register'}
          </button>
        </div>
      )}

      {/* Tour Completion Modal */}
      <Modal
        isOpen={isTourCompletedModalOpen}
        onClose={() => setIsTourCompletedModalOpen(false)}
        size="sm"
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-3xl mb-4 animate-bounce">
            🎉
          </div>
          <h3 className="font-display font-extrabold text-lg text-text-primary mb-2">
            {isVi ? 'Chúc mừng!' : 'Congratulations!'}
          </h3>
          <p className="text-xs text-text-secondary leading-relaxed mb-6">
            {isVi 
              ? `Bạn đã hoàn thành xuất sắc tour đi bộ ẩm thực "${selectedTour?.name}". Hy vọng bạn đã có những trải nghiệm tuyệt vời!`
              : `You have successfully completed the food walking tour "${selectedTour?.name}". We hope you had a wonderful experience!`}
          </p>
          <button
            onClick={() => {
              setIsTourCompletedModalOpen(false);
              handleCloseTour();
            }}
            className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold transition-all text-xs cursor-pointer shadow-md"
          >
            {isVi ? 'Hoàn thành' : 'Done'}
          </button>
        </div>
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
}
