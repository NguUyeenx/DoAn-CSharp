import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { MAPBOX_TOKEN, DEFAULT_CENTER, DEFAULT_ZOOM } from '@/utils/constants';
import { Plus, Minus, Navigation } from 'lucide-react';

// Set access token
mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapViewProps {
  children?: React.ReactNode;
  onMapClick?: (lngLat: [number, number]) => void;
}

export default function MapView({ children, onMapClick }: MapViewProps) {
  const { theme } = useTheme();
  const { setMap, map } = useMap();
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const currentThemeRef = useRef<'light' | 'dark'>(theme);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Determine Mapbox style based on theme
  const getStyleByTheme = (currentTheme: 'light' | 'dark') => {
    return currentTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/streets-v12';
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Mapbox GL instance
    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getStyleByTheme(theme),
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 45, // Slight pitch for 3D buildings feel
      bearing: -10,
      attributionControl: false,
    });

    // Save map instance to context
    setMap(mapInstance);

    mapInstance.on('load', () => {
      setMapLoaded(true);

      // Add 3D buildings layer if available on style
      const layers = mapInstance.getStyle()?.layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      if (mapInstance.getSource('composite')) {
        setTimeout(() => {
          if (mapInstance && !mapInstance.getLayer('3d-buildings') && mapInstance.getSource('composite')) {
            mapInstance.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                  'fill-extrusion-color': theme === 'dark' ? '#332a24' : '#f5ebe6',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height'],
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height'],
                  ],
                  'fill-extrusion-opacity': 0.6,
                },
              },
              labelLayerId
            );
          }
        }, 0);
      }
    });

    if (onMapClick) {
      mapInstance.on('click', (e) => {
        // Prevent click events if clicking on markers/popups
        const target = e.originalEvent.target as HTMLElement;
        if (target.closest('.mapboxgl-marker') || target.closest('.mapboxgl-popup')) {
          return;
        }
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      });
    }

    return () => {
      setMap(null);
      mapInstance.remove();
    };
  }, []); // Run once on mount

  // Sync theme changes with Mapbox style
  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Wait for style load to re-apply 3D building colors if needed
    const handleStyleLoad = () => {
      setTimeout(() => {
        if (map && map.isStyleLoaded() && !map.getLayer('3d-buildings') && map.getSource('composite')) {
          const layers = map.getStyle()?.layers;
          const labelLayerId = layers?.find(
            (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
          )?.id;

          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': theme === 'dark' ? '#332a24' : '#f5ebe6',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height'],
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height'],
                ],
                'fill-extrusion-opacity': 0.6,
              },
            },
            labelLayerId
          );
        }
      }, 0);
    };

    if (currentThemeRef.current !== theme) {
      currentThemeRef.current = theme;
      map.setStyle(getStyleByTheme(theme));
    }

    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [theme, map, mapLoaded]);

  // Zoom Controls
  const handleZoomIn = () => {
    if (!map) return;
    map.zoomTo(map.getZoom() + 1, { duration: 300 });
  };

  const handleZoomOut = () => {
    if (!map) return;
    map.zoomTo(map.getZoom() - 1, { duration: 300 });
  };

  // Center on user (Locate me)
  const handleLocateUser = () => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        map.flyTo({
          center: [longitude, latitude],
          zoom: 16.5,
          pitch: 50,
          essential: true,
          duration: 1200,
        });
      },
      (error) => {
        console.error('Error getting user position:', error);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden select-none bg-surface-alt">
      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Floating Custom Controls */}
      <div className="absolute right-4 bottom-24 md:bottom-6 z-10 flex flex-col gap-2">
        {/* Locate Me */}
        <button
          type="button"
          onClick={handleLocateUser}
          className="w-10 h-10 rounded-[var(--radius-md)] border border-border bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover active:scale-95 transition-all outline-none"
          title={t('map.locateMe', 'Locate Me')}
        >
          <Navigation size={18} className="fill-current text-primary" />
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-t-[var(--radius-md)] border border-border bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover active:scale-95 transition-all outline-none border-b-0"
          title={t('map.zoomIn', 'Zoom In')}
        >
          <Plus size={18} />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-b-[var(--radius-md)] border border-border bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover active:scale-95 transition-all outline-none"
          title={t('map.zoomOut', 'Zoom Out')}
        >
          <Minus size={18} />
        </button>
      </div>

      {/* Renders other map components like Markers, Layers, etc. */}
      {mapLoaded && map && children}
    </div>
  );
}
