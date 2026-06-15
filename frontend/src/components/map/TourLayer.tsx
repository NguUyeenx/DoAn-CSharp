import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { createRoot, type Root } from 'react-dom/client';
import { useMap } from '@/contexts/MapContext';
import { MAPBOX_TOKEN } from '@/utils/constants';
import type { Tour, TourStop } from '@/types/api';

interface TourLayerProps {
  tour: Tour | null;
  activeStopIndex: number | null;
  onStopClick?: (stop: TourStop) => void;
}

export default function TourLayer({ tour, activeStopIndex, onStopClick }: TourLayerProps) {
  const { map } = useMap();
  
  const tourLayerId = 'tour-route-line';
  const tourSourceId = 'tour-route-source';

  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const rootsRef = useRef<Root[]>([]);

  const cleanupMarkers = () => {
    // Unmount all react roots
    const rootsToUnmount = [...rootsRef.current];
    rootsRef.current = [];

    // Defer unmounting to avoid warning: "Attempted to synchronously unmount a root while React was already rendering"
    setTimeout(() => {
      rootsToUnmount.forEach((root) => {
        try {
          root.unmount();
        } catch (e) {
          // Already unmounted or error
        }
      });
    }, 0);

    // Remove all mapbox markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];
  };

  const cleanupLayer = () => {
    if (!map) return;
    try {
      if (map.getLayer(tourLayerId)) {
        map.removeLayer(tourLayerId);
      }
      if (map.getSource(tourSourceId)) {
        map.removeSource(tourSourceId);
      }
    } catch (e) {
      console.warn('Error cleaning up tour layer:', e);
    }
  };

  useEffect(() => {
    if (!map || !tour || tour.stops.length === 0) {
      cleanupLayer();
      cleanupMarkers();
      return;
    }

    let isSubscribed = true;
    const stops = [...tour.stops].sort((a, b) => a.stopOrder - b.stopOrder);

    // 1. Fetch tour walking route
    const fetchTourRoute = async () => {
      try {
        // Mapbox supports up to 25 coordinates in a directions request
        const coordinatesString = stops
          .map((stop) => `${stop.longitude},${stop.latitude}`)
          .join(';');

        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatesString}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch tour directions');
        const data = await response.json();

        if (!isSubscribed) return;

        const route = data.routes?.[0]?.geometry;
        if (!route) {
          // Fallback to direct lines between sequential stops
          drawTourLine({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: stops.map((stop) => [stop.longitude, stop.latitude]),
            },
          });
          return;
        }

        drawTourLine({
          type: 'Feature',
          properties: {},
          geometry: route,
        });

        // Fit map bounds to show the whole tour path
        const bounds = stops.reduce(
          (acc, stop) => acc.extend([stop.longitude, stop.latitude]),
          new mapboxgl.LngLatBounds([stops[0].longitude, stops[0].latitude], [stops[0].longitude, stops[0].latitude])
        );

        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 120, left: 60, right: 60 },
          maxZoom: 16.5,
        });
      } catch (err) {
        console.error('Error fetching tour route, using fallback:', err);
        if (!isSubscribed) return;

        // Fallback: direct lines
        drawTourLine({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: stops.map((stop) => [stop.longitude, stop.latitude]),
          },
        });
      }
    };

    const drawTourLine = (geojson: any) => {
      if (!map) return;
      try {
        const source = map.getSource(tourSourceId) as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(geojson);
        } else {
          map.addSource(tourSourceId, {
            type: 'geojson',
            data: geojson,
          });

          // Render styled tour line
          map.addLayer({
            id: tourLayerId,
            type: 'line',
            source: tourSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#f26522', // Primary brand color
              'line-width': 4.5,
              'line-dasharray': [2, 1.5], // Dashed walking line
              'line-opacity': 0.85,
            },
          });
        }
      } catch (e) {
        console.error('Error adding tour layer:', e);
      }
    };

    // 2. Render HTML numbered markers for stops
    cleanupMarkers();
    
    stops.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = 'tour-stop-marker cursor-pointer relative';

      const root = createRoot(el);
      rootsRef.current.push(root);

      const isActive = activeStopIndex === index;

      root.render(
        <div className="flex flex-col items-center group">
          {/* Stop Order Circular Badge */}
          <div
            className={`
              w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs shadow-md border-2
              transition-all duration-300 transform group-hover:scale-110 active:scale-95
              ${
                isActive
                  ? 'bg-primary border-white text-white scale-110 ring-4 ring-primary/20'
                  : 'bg-card border-primary text-primary hover:border-primary-hover hover:text-primary-hover'
              }
            `}
          >
            {stop.stopOrder}
          </div>
          
          {/* Label (Name of POI) */}
          <div className="absolute top-8 bg-card/95 border border-border px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium whitespace-nowrap shadow-sm text-text-primary scale-90 group-hover:scale-100 opacity-60 group-hover:opacity-100 transition-all">
            {stop.poiName}
          </div>
        </div>
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'top',
      })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map);

      // Bind click
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onStopClick) onStopClick(stop);
      });

      markersRef.current.push(marker);
    });

    fetchTourRoute();

    return () => {
      isSubscribed = false;
      cleanupLayer();
      cleanupMarkers();
    };
  }, [map, tour, activeStopIndex]);

  return null;
}
