import { useState, useRef, useEffect } from 'react';
import type { POIImage } from '@/types/poi';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface POIGalleryProps {
  images: POIImage[];
  fallbackEmoji?: string;
}

export default function POIGallery({ images, fallbackEmoji = '🍴' }: POIGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter and sort: covers first, then others
  const sortedImages = [...images].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0));

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    setActiveIndex(index);
  };

  const scrollTo = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  const nextImage = () => {
    if (activeIndex < sortedImages.length - 1) {
      scrollTo(activeIndex + 1);
    }
  };

  const prevImage = () => {
    if (activeIndex > 0) {
      scrollTo(activeIndex - 1);
    }
  };

  // Sync scroll on resize
  useEffect(() => {
    const handleResize = () => {
      if (!scrollContainerRef.current) return;
      scrollContainerRef.current.scrollLeft = activeIndex * scrollContainerRef.current.clientWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex]);

  if (sortedImages.length === 0) {
    return (
      <div className="w-full aspect-[16/10] rounded-[var(--radius-lg)] border border-border bg-surface-alt flex items-center justify-center text-text-muted">
        <span className="text-5xl" role="img" aria-hidden="true">
          {fallbackEmoji}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full group/gallery">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full aspect-[16/10] rounded-[var(--radius-lg)] overflow-x-auto flex snap-x snap-mandatory scrollbar-hide bg-black/5"
        style={{ scrollSnapStop: 'always' }}
      >
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className="w-full h-full shrink-0 snap-start snap-always relative cursor-pointer"
            onClick={() => setLightboxImage(image.imageUrl)}
          >
            <img
              src={image.imageUrl}
              alt={`POI Gallery Image ${index + 1}`}
              className="w-full h-full object-cover select-none"
              loading="lazy"
            />
            {/* Dark gradient overlay for bottom info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            
            {/* Maximize Icon Overlay */}
            <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/45 text-white/90 backdrop-blur-xs opacity-0 group-hover/gallery:opacity-100 transition-opacity">
              <Maximize2 size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Chevrons - Desktop Only */}
      {sortedImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevImage}
            disabled={activeIndex === 0}
            className={`
              absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/85 text-text-primary backdrop-blur-xs border border-border shadow-md
              flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity cursor-pointer disabled:opacity-0 disabled:pointer-events-none
            `}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextImage}
            disabled={activeIndex === sortedImages.length - 1}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/85 text-text-primary backdrop-blur-xs border border-border shadow-md
              flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity cursor-pointer disabled:opacity-0 disabled:pointer-events-none
            `}
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* Swipe/Indicator Dots */}
      {sortedImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-2 py-1 rounded-full bg-black/20 backdrop-blur-xs">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`
                w-1.5 h-1.5 rounded-full transition-all cursor-pointer
                ${activeIndex === index ? 'bg-white w-3.5' : 'bg-white/50 hover:bg-white/80'}
              `}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Lightbox / Zoom Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer outline-none border-0"
          >
            <X size={24} />
          </button>
          {/* Lightbox image */}
          <img
            src={lightboxImage}
            alt="POI Gallery Zoom"
            className="max-w-[95%] max-h-[85vh] object-contain rounded-[var(--radius-md)] select-none animate-scale-in"
          />
        </div>
      )}
    </div>
  );
}
