import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { createRoot, type Root } from 'react-dom/client';
import { useMap } from '@/contexts/MapContext';
import type { POIListItem, POI } from '@/types/poi';
import MarkerPopup from './MarkerPopup';

interface POIMarkerProps {
  poi: POIListItem | POI;
  isSelected: boolean;
  onClick?: () => void;
  onDetailClick: (poi: POIListItem | POI) => void;
}

export default function POIMarker({ poi, isSelected, onClick, onDetailClick }: POIMarkerProps) {
  const { map } = useMap();
  
  // Keep refs for cleanup
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const markerRootRef = useRef<Root | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Emojis mapping for categories
  const getCategoryEmoji = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ốc') || cat.includes('snail')) return '🐚';
    if (cat.includes('lẩu') || cat.includes('hotpot')) return '🍲';
    if (cat.includes('nướng') || cat.includes('bbq') || cat.includes('grill')) return '🍢';
    if (cat.includes('ăn vặt') || cat.includes('snack')) return '🍡';
    if (cat.includes('bánh mì')) return '🥖';
    if (cat.includes('nước') || cat.includes('uống') || cat.includes('drink') || cat.includes('beer')) return '🥤';
    return '🍴';
  };

  useEffect(() => {
    if (!map) return;

    // 1. Create custom HTML element for marker
    const markerEl = document.createElement('div');
    markerEl.className = 'custom-map-marker cursor-pointer relative flex items-center justify-center';
    
    // Create Root for rendering marker React content
    const markerRoot = createRoot(markerEl);
    markerRootRef.current = markerRoot;

    // 2. Create popup element and content
    const popupContentEl = document.createElement('div');
    popupContentEl.className = 'w-full';
    const popupRoot = createRoot(popupContentEl);
    popupRootRef.current = popupRoot;
    popupRoot.render(<MarkerPopup poi={poi} onDetailClick={onDetailClick} />);

    const popup = new mapboxgl.Popup({
      offset: 38,
      closeButton: true,
      closeOnClick: false, // Close when map clicked or other markers clicked
      className: 'custom-mapbox-popup animate-scale-in',
    }).setDOMContent(popupContentEl);
    popupRef.current = popup;

    // 3. Create Mapbox Marker
    const marker = new mapboxgl.Marker({
      element: markerEl,
      anchor: 'bottom',
    })
      .setLngLat([poi.longitude, poi.latitude])
      .setPopup(popup)
      .addTo(map);
    
    markerRef.current = marker;

    // Listen to click on marker element
    markerEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onClick) onClick();
    });

    // Handle popup close event (deselection triggers)
    popup.on('close', () => {
      // Mapbox automatically triggers this when closed
    });

    // Cleanup
    return () => {
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      if (markerRootRef.current) {
        markerRootRef.current.unmount();
        markerRootRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [map, poi.id]); // Re-create only on map or id change

  // Sync isSelected state & render marker icon
  useEffect(() => {
    if (!markerRootRef.current || !markerRef.current) return;

    // Render the React content inside Mapbox marker element
    markerRootRef.current.render(
      <div className="relative flex items-center justify-center">
        {/* Pulse Ring if Selected */}
        {isSelected && (
          <div className="absolute w-12 h-12 rounded-full bg-primary/20 border border-primary/40 animate-pulse-ring" />
        )}
        
        {/* Main Marker pin shape */}
        <div
          className={`
            relative w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2
            transition-all duration-300 ease-[var(--ease-out-quart)]
            ${
              isSelected
                ? 'bg-primary border-white scale-115 text-white z-30'
                : 'bg-card border-primary text-text-primary hover:scale-105 z-10'
            }
          `}
        >
          {/* Emojis based on category */}
          <span className="text-lg" role="img" aria-label={poi.category}>
            {getCategoryEmoji(poi.category)}
          </span>

          {/* Little triangle pin tail */}
          <div
            className={`
              absolute bottom-[-6px] left-[50%] translate-x-[-50%] w-0 h-0
              border-l-[6px] border-l-transparent
              border-r-[6px] border-r-transparent
              transition-colors duration-300
              ${isSelected ? 'border-t-[6px] border-t-primary' : 'border-t-[6px] border-t-card'}
            `}
          />
        </div>
      </div>
    );

    // Sync Mapbox Popup display
    const popup = popupRef.current;
    if (popup && map) {
      if (isSelected) {
        // Center camera slightly above POI to make space for the popup
        map.easeTo({
          center: [poi.longitude, poi.latitude + 0.0006],
          zoom: Math.max(map.getZoom(), 16),
          duration: 400,
        });
        
        if (!popup.isOpen()) {
          // Open popup programmatically
          markerRef.current.togglePopup();
        }
      } else {
        if (popup.isOpen()) {
          popup.remove();
        }
      }
    }
  }, [isSelected, map, poi.longitude, poi.latitude, poi.category]);

  // Sync dynamic content in popup when POI properties change
  useEffect(() => {
    if (popupRootRef.current) {
      popupRootRef.current.render(<MarkerPopup poi={poi} onDetailClick={onDetailClick} />);
    }
  }, [poi, onDetailClick]);

  return null; // Rendered via Mapbox DOM, doesn't draw anything directly in React DOM tree
}
