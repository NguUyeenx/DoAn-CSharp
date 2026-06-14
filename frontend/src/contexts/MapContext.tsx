import { createContext, useContext, useRef, useState, type ReactNode, type MutableRefObject } from 'react';
import type { Map } from 'mapbox-gl';

interface MapContextValue {
  map: Map | null;
  mapRef: MutableRefObject<Map | null>;
  setMap: (map: Map | null) => void;
}

const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMapState] = useState<Map | null>(null);
  const mapRef = useRef<Map | null>(null);

  const setMap = (newMap: Map | null) => {
    mapRef.current = newMap;
    setMapState(newMap);
  };


  return (
    <MapContext.Provider value={{ map, mapRef, setMap }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}
