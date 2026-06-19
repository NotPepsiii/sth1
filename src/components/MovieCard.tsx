import { useState } from "react";
import { Play, Plus, Check, Info, Star } from "lucide-react";
import { motion } from "motion/react";
import { MediaItem } from "../types";

interface MovieCardProps {
  key?: any;
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (item: MediaItem) => void;
}

export default function MovieCard({
  item,
  onSelect,
  onPlay,
  isInWatchlist,
  onToggleWatchlist,
}: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const title = item.title || item.name || "Untitled Production";
  const releaseDate = item.release_date || item.first_air_date || "";
  const releaseYear = releaseDate ? releaseDate.substring(0, 4) : "2026";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");

  // TMDB Image Base URLs
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : `https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=342&auto=format&fit=crop`; // Beautiful fallback movie poster

  return (
    <motion.div
      id={`movie-card-${item.id}`}
      className="relative flex-none w-44 md:w-52 h-64 md:h-76 rounded-lg overflow-hidden group cursor-pointer bg-neutral-900 border border-neutral-800/60 transition-all duration-300"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        y: -8,
        borderColor: "rgba(0, 240, 255, 0.45)",
        boxShadow: "0 10px 25px -5px rgba(0, 240, 255, 0.15), 0 8px 10px -6px rgba(189, 0, 255, 0.1)",
      }}
    >
      {/* Background Poster Image */}
      <img
        src={posterUrl}
        alt={title}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 scale-100 group-hover:scale-105"
      />

      {/* Cybernetic Grid & Scanning Glow Lines (Top Overlay) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-neutral-950/40 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />

      {/* Floating Meta Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
        {/* Rating Badge */}
        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-cyan-400/30 text-amber-400">
          <Star className="w-2.5 h-2.5 fill-amber-400 stroke-none" />
          {rating}
        </span>
        {/* Media Type Badge */}
        <span className="text-[10px] uppercase font-mono font-bold bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded border border-purple-400/30 text-purple-300 tracking-wider">
          {mediaType === "tv" ? "Series" : "Movie"}
        </span>
      </div>

      {/* Futuristic Hover Overlay Panel */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent">
        {/* Title and Release Info */}
        <h4 className="font-title text-[13px] md:text-sm font-bold tracking-tight text-white mb-1 line-clamp-2">
          {title}
        </h4>
        
        <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-neutral-400">
          <span>{releaseYear}</span>
          <span className="w-1 h-1 rounded-full bg-neutral-600" />
          <span className="text-cyan-400 uppercase">{item.vote_average > 7 ? "Prime" : "Standard"}</span>
        </div>

        {/* Action Button Strip */}
        <div id={`card-actions-${item.id}`} className="flex items-center gap-2 mt-1">
          {/* Main Play Action */}
          <button
            id={`btn-play-card-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(item);
            }}
            className="flex-1 flex items-center justify-center gap-1 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-purple-500 text-neutral-950 text-xs font-bold py-1.5 px-2 rounded font-title tracking-wide transition-all duration-200 neon-border-cyan"
          >
            <Play className="w-3.5 h-3.5 fill-neutral-950 stroke-neutral-950" />
            PLAY
          </button>

          {/* Plus Add/Remove Watchlist Action */}
          <button
            id={`btn-watchlist-card-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWatchlist(item);
            }}
            className={`flex items-center justify-center w-8 h-8 rounded border border-neutral-700 hover:border-cyan-400 transition-colors ${
              isInWatchlist ? "bg-cyan-500 text-neutral-950 border-cyan-400" : "bg-neutral-900 text-neutral-300"
            }`}
            title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
          >
            {isInWatchlist ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          {/* Info Action */}
          <button
            id={`btn-info-card-${item.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className="flex items-center justify-center w-8 h-8 rounded border border-neutral-700 bg-neutral-900/80 hover:border-purple-400 text-neutral-300 transition-colors"
            title="More Information"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
