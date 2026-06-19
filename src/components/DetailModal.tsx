import { useEffect, useRef } from "react";
import { X, Play, Clock, Star, Calendar, Bookmark, Film, Disc } from "lucide-react";
import { MediaItem } from "../types";

interface DetailModalProps {
  item: MediaItem;
  onClose: () => void;
  onPlay: (item: MediaItem) => void;
  watchlist: number[];
  onToggleWatchlist: (item: MediaItem) => void;
  onSelectSimilar: (item: MediaItem) => void;
}

export default function DetailModal({
  item,
  onClose,
  onPlay,
  watchlist,
  onToggleWatchlist,
  onSelectSimilar,
}: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside of the modal dialog box
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  useEffect(() => {
    // Disable main body scrolling when modal is active
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const title = item.title || item.name || "Untitled Production";
  const releaseDate = item.release_date || item.first_air_date || "";
  const releaseYear = releaseDate ? releaseDate.substring(0, 4) : "2026";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "0.0";
  const mediaType = item.first_air_date ? "tv" : "movie";
  const isInWatchlist = watchlist.includes(item.id);

  // Images fallbacks
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
    : `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop`;

  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : `https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=342&auto=format&fit=crop`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Outer Modal Container Card */}
      <div
        ref={modalRef}
        id="detail-modal-container"
        className="relative bg-neutral-950 border border-neutral-800/80 rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,186,212,0.15)]"
      >
        {/* Banner Splash backdrop with gradient cut */}
        <div className="relative aspect-[21/9] w-full">
          <img
            src={backdropUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Neon Scanner Gradient Blockers */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-neutral-950 to-transparent hidden md:block" />

          {/* Close Trigger Button */}
          <button
            id="btn-close-modal-upper"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/70 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-cyan-400 p-2 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Information Grid */}
        <div className="px-6 md:px-8 pb-8 relative z-10 -mt-16 md:-mt-24">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Hover Floating Poster */}
            <div className="w-36 md:w-48 shrink-0 rounded-lg overflow-hidden border border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.8)] self-center md:self-auto bg-neutral-900">
              <img
                src={posterUrl}
                alt={title}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Core Info Cluster */}
            <div className="flex-1 text-left">
              {/* Media type badge */}
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-purple-950/30 text-purple-300 px-2 py-0.5 rounded border border-purple-800/30 tracking-widest">
                  {mediaType === "tv" ? "TV Series Bundle" : "Cinema Release"}
                </span>

                {item.status && (
                  <span className="text-[10px] uppercase font-mono font-bold bg-cyan-950/30 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/30 tracking-widest">
                    {item.status}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-title font-black text-white tracking-tight uppercase leading-none mb-2">
                {title}
              </h1>

              {item.tagline && (
                <p className="text-xs md:text-sm italic text-cyan-400/80 mb-4 font-mono">
                  &ldquo;{item.tagline}&rdquo;
                </p>
              )}

              {/* Data Specifications Array */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mb-5 text-xs text-neutral-400 font-mono">
                {/* Year */}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  {releaseYear}
                </span>

                {/* Rating */}
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                  {rating || "N/A"}
                </span>

                {/* Duration details */}
                {mediaType === "movie" && item.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    {item.runtime} mins
                  </span>
                )}

                {mediaType === "tv" && (
                  <span className="flex items-center gap-1">
                    <Film className="w-3.5 h-3.5 text-neutral-500" />
                    {item.number_of_seasons} Seasons • {item.number_of_episodes} Episodes
                  </span>
                )}
              </div>

              {/* Action Rows */}
              <div id="modal-actions-panel" className="flex flex-wrap gap-3 mb-6">
                <button
                  id="btn-play-modal"
                  onClick={() => {
                    onPlay(item);
                    onClose();
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-purple-500 text-neutral-950 px-6 py-2.5 rounded-md font-title font-bold text-sm tracking-widest transition-all shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                >
                  <Play className="w-4 h-4 fill-neutral-950 stroke-neutral-950" />
                  LIVE STREAM
                </button>

                <button
                  id="btn-watchlist-modal"
                  onClick={() => onToggleWatchlist(item)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-mono font-bold transition-all border ${
                    isInWatchlist
                      ? "bg-cyan-500/10 border-cyan-400 text-cyan-400"
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isInWatchlist ? "fill-cyan-400" : ""}`} />
                  {isInWatchlist ? "[ LOADED IN QUEUE ]" : "ADD TO WATCHLIST"}
                </button>

                {/* IMDb Official Redirect Link */}
                {item.external_ids?.imdb_id && (
                  <a
                    id="link-imdb-external"
                    href={`https://www.imdb.com/title/${item.external_ids.imdb_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 px-4 py-2.5 rounded-md font-mono font-bold text-xs tracking-wider transition-all"
                  >
                    <Disc className="w-4 h-4" />
                    IMDb DATA NODE
                  </a>
                )}
              </div>

              {/* Synopsis Details */}
              <div className="mb-6">
                <h3 className="text-xs font-mono font-black uppercase text-neutral-500 tracking-widest mb-2">
                  [ System Synopsis Archive ]
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl font-sans">
                  {item.overview || "No comprehensive file records exist in the satellite registry for this cinematic package index."}
                </p>
              </div>
            </div>
          </div>

          {/* Cast Members Grid */}
          {item.credits && item.credits.cast && item.credits.cast.length > 0 && (
            <div className="mt-8 border-t border-neutral-850 pt-6">
              <h3 className="text-xs font-mono font-black uppercase text-cyan-400 tracking-widest mb-4">
                [ Casting Personnel Core ]
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-3 pr-1">
                {item.credits.cast.slice(0, 8).map((actor) => {
                  const actorImage = actor.profile_path
                    ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                    : `https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop`; // Generic portrait placeholder
                  
                  return (
                    <div
                      key={actor.id}
                      className="flex-none w-24 text-center group"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border border-neutral-800 group-hover:border-purple-400 transition-colors bg-neutral-900 shadow-md">
                        <img
                          src={actorImage}
                          alt={actor.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-neutral-200 text-[10px] font-bold mt-2 truncate line-clamp-1">
                        {actor.name}
                      </h4>
                      <p className="text-[9px] font-mono text-neutral-500 truncate mt-0.5">
                        {actor.character || "Unknown Agent"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Similar Items / Related Media Selection */}
          {item.similar && item.similar.results && item.similar.results.length > 0 && (
            <div className="mt-8 border-t border-neutral-850 pt-6">
              <h3 className="text-xs font-mono font-black uppercase text-purple-400 tracking-widest mb-4">
                [ Related Signal Reconnections ]
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2 pr-1">
                {item.similar.results.slice(0, 6).map((similarItem) => {
                  const sTitle = similarItem.title || similarItem.name || "Untitled";
                  const sYear = (similarItem.release_date || similarItem.first_air_date || "").substring(0, 4);
                  const sPoster = similarItem.poster_path
                    ? `https://image.tmdb.org/t/p/w185${similarItem.poster_path}`
                    : `https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=150&auto=format&fit=crop`;

                  return (
                    <button
                      key={similarItem.id}
                      id={`btn-similar-${similarItem.id}`}
                      onClick={() => onSelectSimilar(similarItem)}
                      className="flex-none w-24 text-left group"
                    >
                      <div className="w-24 aspect-[2/3] rounded overflow-hidden border border-neutral-850 group-hover:border-cyan-400 transition-all bg-neutral-900">
                        <img
                          src={sPoster}
                          alt={sTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-200 truncate mt-1.5 group-hover:text-cyan-400 transition-colors">
                        {sTitle}
                      </h4>
                      <span className="text-[9px] font-mono text-neutral-500">
                        {sYear || "2026"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
