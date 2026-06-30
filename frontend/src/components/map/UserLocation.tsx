import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { createRoot, type Root } from 'react-dom/client';
import { useMap } from '@/contexts/MapContext';
import { useGeolocation } from '@/hooks/useGeolocation';

interface UserLocationProps {
  overridePosition?: { latitude: number; longitude: number } | null;
}

export default function UserLocation({ overridePosition }: UserLocationProps) {
  const { map } = useMap();
  const { position: realPosition } = useGeolocation();
  const position = overridePosition !== undefined ? overridePosition : realPosition;
  
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const rootRef = useRef<Root | null>(null);

  useEffect(() => {
    if (!map || !position) {
      // Clean up marker if position is lost or map is not ready
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (rootRef.current) {
        const root = rootRef.current;
        rootRef.current = null;
        setTimeout(() => root.unmount(), 0);
      }
      return;
    }

    const { longitude, latitude } = position;

    // Create marker if it doesn't exist
    if (!markerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker relative flex items-center justify-center pointer-events-none';
      
      const root = createRoot(el);
      rootRef.current = root;
      
      // Render pulsing blue dot
      root.render(
        <div className="relative flex items-center justify-center w-6 h-6">
          {/* Blue pulsing halo */}
          <div className="absolute w-5 h-5 rounded-full bg-accent/35 animate-ping" />
          <div className="absolute w-5 h-5 rounded-full bg-accent/20 border border-accent/40 animate-pulse-ring" />
          
          {/* solid center core */}
          <div className="relative w-3.5 h-3.5 bg-accent border-2 border-white rounded-full shadow-[0_0_6px_rgba(var(--color-accent),0.5)]" />
        </div>
      );

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current = marker;
    } else {
      // Smoothly update location of existing marker
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [map, position]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rootRef.current) {
        const root = rootRef.current;
        rootRef.current = null;
        setTimeout(() => root.unmount(), 0);
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}
