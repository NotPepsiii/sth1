import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaItem } from "../types";
import MovieCard from "./MovieCard";

interface MovieCarouselProps {
  title: string;
  items: MediaItem[];
  watchlist: number[];
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  onToggleWatchlist: (item: MediaItem) => void;
}

export default function MovieCarousel({
  title,
  items,
  watchlist,
  onSelect,
  onPlay,
  onToggleWatchlist,
}: MovieCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Check scroll positions to toggle navigation arrows
  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setShowLeftArrow(el.scrollLeft > 10);
      setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollState);
      // Run once on load to ensure right state
      checkScrollState();
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScrollState);
      }
    };
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative my-8 px-4 md:px-12 group/carousel">
      {/* Tactical Glow Title Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-title text-sm md:text-lg font-bold tracking-[0.15em] text-cyan-400 uppercase flex items-center gap-2">
          <span className="inline-block w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-purple-600 rounded-sm" />
          {title}
        </h3>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest hidden md:inline">
          [ {items.length} Modules Loaded ]
        </span>
      </div>

      {/* Carousel Body Wrapper */}
      <div className="relative">
        {/* Left Pagination Slider Button */}
        {showLeftArrow && (
          <button
            id={`carousel-left-${title.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 md:w-12 h-20 md:h-24 bg-black/85 border-y border-r border-cyan-400/30 text-cyan-400 hover:text-white hover:bg-cyan-950/80 rounded-r-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 shadow-[5px_0_15px_-3px_rgba(0,240,255,0.15)]"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {/* Right Pagination Slider Button */}
        {showRightArrow && (
          <button
            id={`carousel-right-${title.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 md:w-12 h-20 md:h-24 bg-black/85 border-y border-l border-cyan-400/30 text-cyan-400 hover:text-white hover:bg-cyan-950/80 rounded-l-md transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 shadow-[-5px_0_15px_-3px_rgba(0,240,255,0.15)]"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        )}

        {/* Horizontal Card Scrolling viewport */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-5 overflow-x-auto overflow-y-hidden pb-4 pt-1 snap-x scrollbar-thin scroll-smooth"
        >
          {items.map((item) => (
            <div key={item.id} className="snap-start">
              <MovieCard
                item={item}
                onSelect={onSelect}
                onPlay={onPlay}
                isInWatchlist={watchlist.includes(item.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
