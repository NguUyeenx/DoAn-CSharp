import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, List, Navigation, ChevronRight } from 'lucide-react';
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
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Custom Hooks
  const { position } = useGeolocation();
  const { pois, loading: poisLoading, fetchPOIs } = usePOIs();
  const { tours, selectedTour, loading: toursLoading, fetchTours, fetchTourById, setSelectedTour } = useTours();
  const { flyTo } = useMapbox();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState<boolean>(false);

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
  }, [fetchPOIs, fetchTours]);

  // Computed POIs with distances based on GPS position
  const poisWithDistance = useMemo(() => {
    return pois.map((poi) => {
      let distance = poi.distanceMeters;
      if (distance === undefined && position) {
        distance = getDistance(position.latitude, position.longitude, poi.latitude, poi.longitude);
      }
      return {
        ...poi,
        distanceMeters: distance,
      };
    });
  }, [pois, position]);

  // Filtered & Sorted POIs
  const filteredPOIs = useMemo(() => {
    let result = poisWithDistance.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory ? item.category.toLowerCase() === selectedCategory.toLowerCase() : true;
      
      const matchesPrice = priceFilter ? ((item.id % 3) + 1).toString() === priceFilter : true;
      
      const matchesFavorite = showFavoritesOnly ? item.isFavorite : true;
      
      const matchesNearby = showNearbyOnly ? (item.distanceMeters !== undefined && item.distanceMeters < 1000) : true;
      
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
                    onSortByChange={setSortBy}
                    showFavoritesOnly={showFavoritesOnly}
                    onShowFavoritesOnlyChange={setShowFavoritesOnly}
                    showNearbyOnly={showNearbyOnly}
                    onShowNearbyOnlyChange={setShowNearbyOnly}
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
                    <div className="text-center py-12 text-text-muted text-xs">
                      {t('search.noResults', 'No food spots found matching your filter.')}
                    </div>
                  )}

                  {!poisLoading && filteredPOIs.map((poi) => (
                    <POICard
                      key={poi.id}
                      poi={poi}
                      onClick={() => handleSelectPoi(poi.id, poi.latitude, poi.longitude)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAP CONTAINER - Full screen */}
        <main className="flex-1 h-full relative">
          <MapView>
            {/* User GPS Dot */}
            <UserLocation />

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

          {/* Floating UI overlay on Map: Active Tour indicator */}
          {selectedTour && (
            <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-xs border border-border p-3 rounded-[var(--radius-lg)] shadow-lg flex items-center justify-between gap-4 max-w-[calc(100vw-32px)] md:max-w-sm animate-slide-in-top">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider font-display">Active Tour</span>
                <h4 className="font-display font-extrabold text-sm text-text-primary leading-tight line-clamp-1">{selectedTour.name}</h4>
              </div>
              <button
                onClick={handleCloseTour}
                className="text-xs font-semibold px-2.5 py-1 bg-surface-alt border border-border rounded-md hover:bg-border transition-colors cursor-pointer outline-none shrink-0"
              >
                End
              </button>
            </div>
          )}

          {/* Floating Directions active bar */}
          {showDirections && (
            <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur-xs border border-teal-600/30 p-3 rounded-[var(--radius-lg)] shadow-lg flex items-center justify-between gap-4 max-w-[calc(100vw-32px)] md:max-w-sm animate-slide-in-top">
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
              onSortByChange={setSortBy}
              showFavoritesOnly={showFavoritesOnly}
              onShowFavoritesOnlyChange={setShowFavoritesOnly}
              showNearbyOnly={showNearbyOnly}
              onShowNearbyOnlyChange={setShowNearbyOnly}
            />
          </div>

          {/* Scrollable Food Spots cards */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24 scrollbar-thin">
            {poisLoading ? (
              <div className="text-center py-12 text-xs font-semibold text-text-muted animate-pulse">{t('common.loading', 'Loading...')}</div>
            ) : filteredPOIs.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">{t('search.noResults', 'No food spots found.')}</div>
            ) : (
              filteredPOIs.map((poi) => (
                <POICard
                  key={poi.id}
                  poi={poi}
                  onClick={() => handleSelectPoi(poi.id, poi.latitude, poi.longitude)}
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
                        handleCloseTour();
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

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
}
