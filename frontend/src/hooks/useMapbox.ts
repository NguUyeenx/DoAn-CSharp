import { useCallback } from 'react';
import { useMap } from '@/contexts/MapContext';

export function useMapbox() {
  const { map } = useMap();

  const flyTo = useCallback(
    (coords: [number, number] | { lat: number; lng: number } | { latitude: number; longitude: number }, zoom?: number) => {
      if (!map) return;

      let center: [number, number];
      if (Array.isArray(coords)) {
        center = coords;
      } else if ('lng' in coords && 'lat' in coords) {
        center = [coords.lng, coords.lat];
      } else if ('latitude' in coords && 'longitude' in coords) {
        center = [coords.longitude, coords.latitude];
      } else {
        return;
      }

      map.flyTo({
        center,
        zoom: zoom ?? map.getZoom(),
        essential: true,
        duration: 1500,
      });
    },
    [map]
  );

  const fitBounds = useCallback(
    (bounds: [[number, number], [number, number]], padding = 50) => {
      if (!map) return;
      map.fitBounds(bounds, { padding });
    },
    [map]
  );

  const zoomIn = useCallback(() => {
    if (!map) return;
    map.zoomIn();
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    map.zoomOut();
  }, [map]);

  return {
    map,
    flyTo,
    fitBounds,
    zoomIn,
    zoomOut,
  };
}

export default useMapbox;
