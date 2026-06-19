import { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  Gamepad,
  Heart,
  Clock,
  Tv,
  Film,
  Compass,
  Volume2,
  AlertCircle,
  TrendingUp,
  History,
  Bookmark,
  Calendar,
  Star,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MediaItem, WatchHistoryItem, WatchlistItem } from "./types";
import MovieCard from "./components/MovieCard";
import MovieCarousel from "./components/MovieCarousel";
import VideoPlayer from "./components/VideoPlayer";
import DetailModal from "./components/DetailModal";

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"home" | "movies" | "series" | "watchlist" | "history">("home");
  
  // Data lists
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [popularTV, setPopularTV] = useState<MediaItem[]>([]);
  const [scifiMovies, setScifiMovies] = useState<MediaItem[]>([]);
  const [actionMovies, setActionMovies] = useState<MediaItem[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<MediaItem[]>([]);
  const [spotlightItem, setSpotlightItem] = useState<MediaItem | null>(null);

  // User States (Persisted)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Active overlays/viewer
  const [activePlayerItem, setActivePlayerItem] = useState<MediaItem | null>(null);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<MediaItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // System general logs/states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const theaterRef = useRef<HTMLDivElement>(null);

  // Load local watchlist & history
  useEffect(() => {
    try {
      const persistedWatchlist = localStorage.getItem("cinestream_watchlist");
      if (persistedWatchlist) {
        setWatchlist(JSON.parse(persistedWatchlist));
      }
      const persistedHistory = localStorage.getItem("cinestream_history");
      if (persistedHistory) {
        setWatchHistory(JSON.parse(persistedHistory));
      }
    } catch (e) {
      console.error("Local storage sync error:", e);
    }
  }, []);

  // Update clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short"
      };
      setCurrentTime(now.toLocaleTimeString("en-US", options));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial content feed on load
  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [trendingRes, tvRes, scifiRes, actionRes, horrorRes] = await Promise.all([
          fetch("/api/trending?type=movie"),
          fetch("/api/trending?type=tv"),
          fetch("/api/discover?type=movie&genres=878"), // Sci-Fi
          fetch("/api/discover?type=movie&genres=28"),  // Action
          fetch("/api/discover?type=movie&genres=27"),  // Horror
        ]);

        if (!trendingRes.ok || !tvRes.ok || !scifiRes.ok) {
          throw new Error("Could not sync communication modules with streaming proxy.");
        }

        const trendingData = await trendingRes.json();
        const tvData = await tvRes.json();
        const scifiData = await scifiRes.json();
        const actionData = await actionRes.json();
        const horrorData = await horrorRes.json();

        const moviesList = trendingData.results || [];
        setTrendingMovies(moviesList);
        setPopularTV(tvData.results || []);
        setScifiMovies(scifiData.results || []);
        setActionMovies(actionData.results || []);
        setHorrorMovies(horrorData.results || []);

        // Pick top trending movie as spotlight hero banner with fallback details fetch
        if (moviesList.length > 0) {
          const topItem = moviesList[0];
          fetchFullDetails(topItem.id, "movie", true);
        }
      } catch (err: any) {
        console.error("Content loading error:", err);
        setErrorMsg("Communication link with database is lost. Check back in a few moments.");
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

  // Real-time search processing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchLoading(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          // Filter out items without post paths to maintain premium visuals
          const filtered = (data.results || []).filter(
            (item: MediaItem) => item.poster_path && (item.media_type === "movie" || item.media_type === "tv")
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Fetch full details of movie/tv (including runtime, imdb_id, cast details, etc)
  const fetchFullDetails = async (id: number, type: "movie" | "tv", isSpotlight = false) => {
    if (!isSpotlight) setLoadingDetails(true);
    try {
      const res = await fetch(`/api/${type}/${id}`);
      if (res.ok) {
        const fullItemDetails = await res.json();
        // Inject media type back just in case
        fullItemDetails.media_type = type;

        if (isSpotlight) {
          setSpotlightItem(fullItemDetails);
        } else {
          setSelectedDetailsItem(fullItemDetails);
        }
      }
    } catch (err) {
      console.error("Details loading error:", err);
    } finally {
      if (!isSpotlight) setLoadingDetails(false);
    }
  };

  // Toggle watchlist
  const handleToggleWatchlist = (item: MediaItem) => {
    const isTv = item.first_air_date !== undefined;
    const itemType = item.media_type || (isTv ? "tv" : "movie");
    const exists = watchlist.some((w) => w.mediaId === item.id);
    let updated;

    if (exists) {
      updated = watchlist.filter((w) => w.mediaId !== item.id);
    } else {
      const newItem: WatchlistItem = {
        mediaId: item.id,
        title: item.title || item.name || "Untitled",
        posterPath: item.poster_path,
        mediaType: itemType as "movie" | "tv",
        backdropPath: item.backdrop_path,
        voteAverage: item.vote_average,
        releaseDate: item.release_date || item.first_air_date
      };
      updated = [newItem, ...watchlist];
    }

    setWatchlist(updated);
    localStorage.setItem("cinestream_watchlist", JSON.stringify(updated));
  };

  // Handle live history updates from active player playing actions
  const handleUpdateHistory = (newHistoryItem: WatchHistoryItem) => {
    // Filter older history coordinates
    const filtered = watchHistory.filter((h) => h.mediaId !== newHistoryItem.mediaId);
    const updated = [newHistoryItem, ...filtered].slice(0, 20); // Hold top 20 actions
    setWatchHistory(updated);
    localStorage.setItem("cinestream_history", JSON.stringify(updated));
  };

  // Clear watchlist entirely
  const handleClearWatchlist = () => {
    setWatchlist([]);
    localStorage.removeItem("cinestream_watchlist");
  };

  // Clear history entirely
  const handleClearHistory = () => {
    setWatchHistory([]);
    localStorage.removeItem("cinestream_history");
  };

  // Active play triggers scroll and open
  const startPlayback = async (item: MediaItem) => {
    const isTv = item.first_air_date !== undefined;
    const itemType = item.media_type || (isTv ? "tv" : "movie");

    // Fetch details to ensure IMDb is ready for embed link
    try {
      const response = await fetch(`/api/${itemType}/${item.id}`);
      if (response.ok) {
        const fullItem = await response.json();
        fullItem.media_type = itemType;
        setActivePlayerItem(fullItem);
        // Stagger viewport focus to active cinema theatre screen container
        setTimeout(() => {
          theaterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } catch (e) {
      console.error("Playback load error, loading standard payload instead:", e);
      setActivePlayerItem(item);
    }
  };

  const watchlistMediaIds = watchlist.map((w) => w.mediaId);

  // Render search-results grid or default carousels
  const renderHomeFeeds = () => {
    if (isSearching) {
      return (
        <div id="searching-matrix-overlay" className="px-4 md:px-12 py-10">
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-8">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="font-title text-base md:text-xl font-bold uppercase tracking-wider text-cyan-400">
              Filtered Decryption Matrix: &ldquo;{searchQuery}&rdquo;
            </h2>
            {searchLoading ? (
              <span className="text-xs font-mono text-neutral-500 animate-pulse">[ Scanning Database... ]</span>
            ) : (
              <span className="text-xs font-mono text-neutral-500">[ {searchResults.length} Streams Traced ]</span>
            )}
          </div>

          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center rounded-lg border border-dashed border-neutral-800 bg-neutral-900/10">
              <AlertCircle className="w-12 h-12 text-neutral-600 mb-4" />
              <p className="text-sm font-mono text-neutral-400 uppercase tracking-widest">
                No playable coordinates match your query index.
              </p>
              <button
                id="btn-search-clear-hint"
                onClick={() => setSearchQuery("")}
                className="mt-4 text-xs font-mono text-cyan-400 hover:underline hover:text-white"
              >
                [ RESET ENTIRE DATABASE SEARCH FILTER ]
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
              {searchResults.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  isInWatchlist={watchlistMediaIds.includes(item.id)}
                  onSelect={(i) => fetchFullDetails(i.id, i.media_type || (i.first_air_date ? "tv" : "movie"))}
                  onPlay={startPlayback}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Default Cinematic dashboard views
    return (
      <div id="cinematic-carousels-container">
        {/* Playable Watch history slider component if populated */}
        {watchHistory.length > 0 && (
          <div className="my-8 px-4 md:px-12 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-sm md:text-lg font-bold tracking-[0.15em] text-neutral-300 uppercase flex items-center gap-2">
                <span className="inline-block w-1.5 h-4 bg-gradient-to-b from-neutral-400 to-cyan-500 rounded-sm" />
                [ RECONSTITUTE PLAYBACK HISTORIES ]
              </h3>
              <button
                id="btn-clear-complete-history"
                onClick={handleClearHistory}
                className="text-[9px] font-mono text-rose-500 hover:text-rose-400 uppercase tracking-widest"
              >
                [ WIPE FLIGHT HISTORY DATA ]
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 pr-1">
              {watchHistory.map((item) => {
                const dummyMedia: MediaItem = {
                  id: item.mediaId,
                  title: item.mediaType === "movie" ? item.title : undefined,
                  name: item.mediaType === "tv" ? item.title : undefined,
                  poster_path: item.posterPath,
                  backdrop_path: null,
                  media_type: item.mediaType,
                  overview: "Playback history track resume vector",
                  genre_ids: [],
                  popularity: 1,
                  vote_average: item.progressPercent / 10,
                  vote_count: 1
                };

                return (
                  <div key={item.mediaId} className="relative group/history shrink-0 w-36 md:w-44">
                    <div className="h-52 md:h-60 rounded-md overflow-hidden relative border border-neutral-800 hover:border-cyan-400/80 transition-all cursor-pointer bg-neutral-900 shadow-md">
                      <img
                        src={item.posterPath ? `https://image.tmdb.org/t/p/w185${item.posterPath}` : "https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=150"}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover/history:bg-black/35 transition-colors flex flex-col justify-end p-2.5">
                        <span className="text-[9px] font-mono bg-cyan-950/45 text-cyan-400 px-1 py-0.5 rounded border border-cyan-800/30 w-fit uppercase mb-1">
                          {item.mediaType === "tv" ? "TV Series" : "Movie"}
                        </span>
                        
                        <h4 className="text-[11px] font-bold text-white tracking-tight line-clamp-1 mb-1 font-title">
                          {item.title}
                        </h4>

                        {item.lastSeason && (
                          <span className="text-[8px] font-mono text-neutral-400 block mb-1">
                            RESUME: S{item.lastSeason} Ep {item.lastEpisode}
                          </span>
                        )}

                        {/* Relative Progress Percentage graphical track bar */}
                        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5 border border-neutral-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resume Play button node overlay */}
                    <button
                      id={`btn-resume-history-${item.mediaId}`}
                      onClick={() => startPlayback(dummyMedia)}
                      className="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover/history:opacity-100 flex items-center justify-center transition-opacity rounded-md"
                    >
                      <span className="flex items-center gap-1.5 bg-cyan-400 text-neutral-950 text-xs font-title font-bold tracking-wider py-1.5 px-3 rounded shadow-lg">
                        RESUME STREAM
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories carousels */}
        {activeTab === "home" && (
          <>
            <MovieCarousel
              title="Trending Stream Nodes"
              items={trendingMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="Futuristic Popular TV"
              items={popularTV}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "tv")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="Cosmic Sci-Fi & Fantasy"
              items={scifiMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="Action Modulations"
              items={actionMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="Horrors & Thrillers"
              items={horrorMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </>
        )}

        {activeTab === "movies" && (
          <>
            <MovieCarousel
              title="Trending Movie Feeds"
              items={trendingMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="High-Octane Action Releases"
              items={actionMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <MovieCarousel
              title="Galactic Sci-Fi Selections"
              items={scifiMovies}
              watchlist={watchlistMediaIds}
              onSelect={(i) => fetchFullDetails(i.id, "movie")}
              onPlay={startPlayback}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </>
        )}

        {activeTab === "series" && (
          <MovieCarousel
            title="Premium Modular TV Shows"
            items={popularTV}
            watchlist={watchlistMediaIds}
            onSelect={(i) => fetchFullDetails(i.id, "tv")}
            onPlay={startPlayback}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}
      </div>
    );
  };

  // Convert watch list items back to mock media list for Carousel/Grid reuse compatibility
  const renderWatchlistView = () => {
    if (watchlist.length === 0) {
      return (
        <div className="px-4 md:px-12 py-16 text-center max-w-xl mx-auto">
          <Bookmark className="w-16 h-16 mx-auto text-neutral-700 stroke-1 mb-4" />
          <h2 className="font-title text-base md:text-lg font-bold text-neutral-300 uppercase tracking-widest mb-2">
            No Established Queues Detected
          </h2>
          <p className="text-sm text-neutral-500 font-mono">
            Access the detail terminals of any cinematic series and load it into your private local watchlist cluster.
          </p>
          <button
            id="btn-return-home-watchlist"
            onClick={() => setActiveTab("home")}
            className="mt-6 font-title text-xs font-bold text-cyan-400 hover:text-white border border-cyan-400/30 px-4 py-2 hover:bg-cyan-950/20 rounded transition-all duration-300"
          >
            [ RECONNECT TO CORE BROADCASTS ]
          </button>
        </div>
      );
    }

    return (
      <div id="watchlist-grid-view" className="px-4 md:px-12 py-10">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <h2 className="font-title text-base md:text-xl font-bold uppercase tracking-wider text-cyan-400">
              Decryption Watchlist Queue
            </h2>
          </div>
          <button
            id="btn-clear-complete-watchlist"
            onClick={handleClearWatchlist}
            className="text-[9px] font-mono text-rose-500 hover:text-rose-400 uppercase tracking-widest"
          >
            [ DISCONNECT ALL MODULES ]
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
          {watchlist.map((w) => {
            const dummyMedia: MediaItem = {
              id: w.mediaId,
              title: w.mediaType === "movie" ? w.title : undefined,
              name: w.mediaType === "tv" ? w.title : undefined,
              poster_path: w.posterPath,
              backdrop_path: w.backdropPath,
              media_type: w.mediaType,
              overview: "Locally queued watch coordinate index node.",
              genre_ids: [],
              popularity: 1,
              vote_average: w.voteAverage,
              vote_count: 1,
              release_date: w.mediaType === "movie" ? w.releaseDate : undefined,
              first_air_date: w.mediaType === "tv" ? w.releaseDate : undefined
            };

            return (
              <MovieCard
                key={w.mediaId}
                item={dummyMedia}
                isInWatchlist={watchlistMediaIds.includes(w.mediaId)}
                onSelect={(i) => fetchFullDetails(i.id, i.media_type || "movie")}
                onPlay={startPlayback}
                onToggleWatchlist={handleToggleWatchlist}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // History listing full tab
  const renderHistoryView = () => {
    if (watchHistory.length === 0) {
      return (
        <div className="px-4 md:px-12 py-16 text-center max-w-xl mx-auto">
          <History className="w-16 h-16 mx-auto text-neutral-700 stroke-1 mb-4" />
          <h2 className="font-title text-base md:text-lg font-bold text-neutral-300 uppercase tracking-widest mb-2">
            History Archiver Empty
          </h2>
          <p className="text-sm text-neutral-500 font-mono">
            No active stream histories have been logged onto this station index core. Turn on a movie to initiate logs.
          </p>
        </div>
      );
    }

    return (
      <div id="history-logs-terminal" className="px-4 md:px-12 py-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded bg-purple-500 animate-pulse" />
            <h2 className="font-title text-base md:text-xl font-bold uppercase tracking-wider text-purple-400">
              Terminal Log History Coordinates
            </h2>
          </div>
          <button
            id="btn-clear-complete-history-full"
            onClick={handleClearHistory}
            className="text-[9px] font-mono text-rose-500 hover:text-rose-400 uppercase tracking-widest"
          >
            [ PURGE LOG REPOSITORY ]
          </button>
        </div>

        <div className="space-y-4">
          {watchHistory.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleString();
            const dummyMedia: MediaItem = {
              id: item.mediaId,
              title: item.mediaType === "movie" ? item.title : undefined,
              name: item.mediaType === "tv" ? item.title : undefined,
              poster_path: item.posterPath,
              backdrop_path: null,
              media_type: item.mediaType,
              overview: "Resume playback vector history coordinate index",
              genre_ids: [],
              popularity: 1,
              vote_average: item.progressPercent / 10,
              vote_count: 1
            };

            return (
              <div
                key={item.mediaId}
                className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-neutral-850 bg-neutral-900/10 hover:border-cyan-400/30 rounded-md transition-all"
              >
                <div className="w-16 shrink-0 aspect-[2/3] rounded overflow-hidden border border-neutral-800 bg-neutral-950">
                  <img
                    src={item.posterPath ? `https://image.tmdb.org/t/p/w185${item.posterPath}` : "https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=150"}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <span className="text-[9px] font-mono uppercase bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-750">
                    {item.mediaType === "tv" ? "TV Series Stream" : "Movie stream"}
                  </span>
                  <h3 className="text-sm font-title font-bold text-white mt-1.5 truncate">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-mono text-neutral-500">
                    <span>INDEX POINT: {item.progressPercent}% COMPLETE</span>
                    {item.lastSeason && (
                      <span>RESUME COORDINATES: S{item.lastSeason} E{item.lastEpisode}</span>
                    )}
                    <span>STAMPED: {dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    id={`btn-history-play-${item.mediaId}`}
                    onClick={() => startPlayback(dummyMedia)}
                    className="bg-cyan-500 text-neutral-950 px-4 py-1.5 rounded font-title text-xs font-bold tracking-wider hover:bg-cyan-400 transition-colors"
                  >
                    LAUCH TRANSMISSION
                  </button>
                  <button
                    id={`btn-history-delete-${item.mediaId}`}
                    onClick={() => {
                      const updated = watchHistory.filter((h) => h.mediaId !== item.mediaId);
                      setWatchHistory(updated);
                      localStorage.setItem("cinestream_history", JSON.stringify(updated));
                    }}
                    className="border border-neutral-800 hover:border-rose-500/30 hover:bg-rose-950/20 text-neutral-400 hover:text-rose-400 px-3 py-1.5 rounded font-mono text-xs"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050507] text-white">
      {/* Dynamic Upper Scanner Alert Node if loading or error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-950/80 border-b border-rose-600/30 p-2 text-center text-xs font-mono text-rose-300 relative z-50 flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>ALARM: {errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Futuristic Main Navigation Navbar */}
      <nav id="satellite-nav-node" className="sticky top-0 z-40 bg-[#050507]/90 border-b border-neutral-900/80 backdrop-blur-md py-4 px-4 md:px-12 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo Brand with tech flare */}
          <div
            onClick={() => {
              setActiveTab("home");
              setIsSearching(false);
              setSearchQuery("");
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Film className="w-4.5 h-4.5 text-neutral-950 fill-neutral-950" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-title font-black text-xs md:text-sm tracking-[0.2em] text-white transition-colors group-hover:text-cyan-400">
                CINE_ [STREAM]
              </span>
              <span className="text-[8px] font-mono text-neutral-500 tracking-[0.3em] uppercase mt-0.5">
                NETFLIX_2088_CORE
              </span>
            </div>
          </div>

          {/* Time System Overlay for Desktop */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-[10px] font-mono text-cyan-400/80 border border-cyan-400/30 rounded px-1.5 py-0.5 bg-cyan-950/20">
              {currentTime || "SYS ACTIVE"}
            </span>
          </div>
        </div>

        {/* Categories Link Arrays */}
        <div id="nav-terminals" className="flex items-center gap-1.5 md:gap-2">
          {[
            { tag: "home", label: "HOME FEEDS" },
            { tag: "movies", label: "MOVIES" },
            { tag: "series", label: "TV SERIES" },
            { tag: "watchlist", label: "MY QUEUE" },
            { tag: "history", label: "TRANSMISSIONS" },
          ].map((tab) => {
            const isTabActive = activeTab === tab.tag && !isSearching;
            return (
              <button
                key={tab.tag}
                id={`btn-nav-tab-${tab.tag}`}
                onClick={() => {
                  setActiveTab(tab.tag as any);
                  setIsSearching(false);
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded text-[11px] md:text-xs font-mono font-bold tracking-wider transition-all duration-300 ${
                  isTabActive
                    ? "bg-cyan-500/10 border-b-2 border-cyan-400 text-cyan-400"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Search Bar Input Cluster */}
        <div className="flex items-center gap-4 w-full md:w-64 relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-cyan-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-input-field"
              type="text"
              placeholder="SEARCH STREAMING TARGET..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/60 border border-neutral-800/80 hover:border-cyan-400/40 focus:border-cyan-400 focus:outline-none rounded-lg py-1.5 pl-9 pr-8 text-xs font-mono text-white placeholder-neutral-500 transition-all duration-300"
            />
            {searchQuery && (
              <button
                id="btn-search-clear-input"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-rose-400 font-mono text-xs"
              >
                ✖
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono text-neutral-400 truncate w-20 max-w-20">
              {currentTime || "SYS READY"}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Broadcast Cinema Theatre Screen Row */}
      <div ref={theaterRef}>
        <AnimatePresence>
          {activePlayerItem && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <VideoPlayer
                item={activePlayerItem}
                onClose={() => setActivePlayerItem(null)}
                onUpdateHistory={handleUpdateHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top Level Featured Movie Spotlight Banner if not searching */}
      {!loading && !errorMsg && !isSearching && activeTab === "home" && spotlightItem && (
        <div
          id="spotlight-hero-banner"
          className="relative w-full aspect-[21/9] min-h-[400px] md:min-h-[500px] flex items-end p-4 md:p-12 border-b border-neutral-900"
        >
          {/* Spotlight Large Backsplash image */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none">
            <img
              src={
                spotlightItem.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${spotlightItem.backdrop_path}`
                  : `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200`
              }
              alt={spotlightItem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {/* Cinematic Fades overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/35 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#050507] via-[#050507]/40 to-transparent hidden md:block" />
          </div>

          {/* Spotlight Metadata block overlay */}
          <div className="max-w-2xl relative z-10 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold bg-cyan-400 text-neutral-950 px-2 py-0.5 rounded shadow-lg">
                <Sparkles className="w-2.5 h-2.5 fill-neutral-950 stroke-neutral-950" />
                SATELLITE HERO SPOTLIGHT
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80">
                RELEASE YEAR: {(spotlightItem.release_date || "2026").substring(0, 4)}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-title font-black text-white tracking-tighter uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-neutral-400 leading-none">
              {spotlightItem.title || spotlightItem.name}
            </h1>

            {spotlightItem.tagline && (
              <p className="text-xs md:text-sm font-mono text-cyan-400 italic mb-3">
                &ldquo;{spotlightItem.tagline}&rdquo;
              </p>
            )}

            <p className="text-xs md:text-sm text-neutral-300 leading-relaxed font-sans mb-6 line-clamp-3 md:line-clamp-4 max-w-xl">
              {spotlightItem.overview}
            </p>

            {/* Quick Action triggers */}
            <div id="spotlight-actions" className="flex items-center gap-3">
              <button
                id="btn-play-spotlight"
                onClick={() => startPlayback(spotlightItem)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-purple-500 text-neutral-950 px-6 py-2.5 rounded-md font-title font-bold text-xs tracking-widest transition-all duration-300 shadow-[0_4px_30px_rgba(0,240,255,0.2)]"
              >
                <Play className="w-3.5 h-3.5 fill-neutral-950 stroke-neutral-950" />
                PLAY LIVE SIGNAL
              </button>

              <button
                id="btn-info-spotlight"
                onClick={() => setSelectedDetailsItem(spotlightItem)}
                className="flex items-center gap-1.5 border border-neutral-700 hover:border-cyan-400 bg-neutral-950/70 hover:bg-cyan-950/20 text-neutral-200 hover:text-white px-5 py-2.5 rounded-md font-mono font-bold text-xs transition-colors"
              >
                MORE INFO RECORD
              </button>

              <button
                id="btn-watchlist-spotlight"
                onClick={() => handleToggleWatchlist(spotlightItem)}
                className={`p-2.5 rounded-md border transition-colors ${
                  watchlistMediaIds.includes(spotlightItem.id)
                    ? "bg-cyan-500 border-cyan-400 text-neutral-950"
                    : "border-neutral-700 bg-neutral-950/70 hover:border-cyan-400 text-neutral-300"
                }`}
                title="Add code to watchlist queue"
              >
                <Bookmark className="w-4 h-4 fill-transparent" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Dashboard Feeds Container */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-cyan-400 mb-4" />
            <p className="text-sm font-mono text-cyan-400 uppercase tracking-[0.2em] animate-pulse">
              SYNCING SATELLITE COMMUNICATIONS TARGETS...
            </p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
            <p className="text-sm font-mono text-rose-400 uppercase tracking-widest text-center">
              SYSTEM COMMUNICATIONS ERROR
            </p>
            <p className="text-xs text-neutral-500 mt-2 text-center max-w-md">
              {errorMsg}
            </p>
            <button
              id="btn-retry-feed"
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 border border-rose-500/30 font-title text-xs text-rose-400 uppercase rounded bg-rose-950/15 hover:bg-rose-500/10 transition-all"
            >
              [ FORCE RESTART TRANSCRIPTION LINKS ]
            </button>
          </div>
        ) : activeTab === "watchlist" ? (
          renderWatchlistView()
        ) : activeTab === "history" ? (
          renderHistoryView()
        ) : (
          renderHomeFeeds()
        )}
      </main>

      {/* Detail Overlay Drawer modal */}
      <AnimatePresence>
        {selectedDetailsItem && (
          <DetailModal
            item={selectedDetailsItem}
            onClose={() => setSelectedDetailsItem(null)}
            onPlay={startPlayback}
            watchlist={watchlistMediaIds}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectSimilar={(similarItem) => {
              const similarType = similarItem.media_type || (similarItem.first_air_date ? "tv" : "movie");
              fetchFullDetails(similarItem.id, similarType);
            }}
          />
        )}
      </AnimatePresence>

      {/* Visual background footer lines */}
      <footer className="border-t border-neutral-900 bg-[#020204] py-8 px-4 md:px-12 text-center text-neutral-600 text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="tracking-wider text-[11px] uppercase">[ SYNCED VIA IMDB DATA NODES & TMDB MODULE PORTAL ]</p>
            <p className="text-[10px] text-neutral-700 mt-1 uppercase">ALL INCOMING TRANSMISSIONS ARE DECRYPTED LOCALLY OVER SECURE IFRAMES</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase">CINESTREAM DECODER CLIENT v1.4.0</p>
            <p className="text-[9px] text-neutral-700 mt-0.5 tracking-widest uppercase">LATENCY ROUTING: CLOUD COMPUTE NETWORK ESTABLISHED</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


