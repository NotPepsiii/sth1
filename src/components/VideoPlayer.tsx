import { useState, useEffect } from "react";
import { X, Play, Server, Monitor, ListVideo, Layers, Maximize, AlertCircle, ExternalLink } from "lucide-react";
import { MediaItem, WatchHistoryItem } from "../types";

interface VideoPlayerProps {
  item: MediaItem;
  onClose: () => void;
  onUpdateHistory: (history: WatchHistoryItem) => void;
}

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
}

export default function VideoPlayer({ item, onClose, onUpdateHistory }: VideoPlayerProps) {
  // Configurable stream servers
  const [selectedServer, setSelectedServer] = useState<"embedmstr" | "vidsrc" | "embedsu">("embedmstr");
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState<boolean>(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  
  const title = item.title || item.name || "Unknown title";
  const imdbId = item.external_ids?.imdb_id || "";
  const tmdbId = item.id;
  const isShow = item.first_air_date !== undefined;

  // Track episode changes to save watch history
  useEffect(() => {
    // Record history
    const historyItem: WatchHistoryItem = {
      mediaId: item.id,
      title: item.title || item.name || "Untitled",
      posterPath: item.poster_path,
      mediaType: isShow ? "tv" : "movie",
      timestamp: Date.now(),
      progressPercent: isShow ? Math.round((currentEpisode / (item.number_of_episodes || 10)) * 100) : 10,
      lastSeason: isShow ? currentSeason : undefined,
      lastEpisode: isShow ? currentEpisode : undefined,
    };
    onUpdateHistory(historyItem);
  }, [currentSeason, currentEpisode, item]);

  // Fetch episodes when season or show changes
  useEffect(() => {
    if (isShow) {
      fetchSeasonEpisodes(currentSeason);
    }
  }, [currentSeason, item]);

  const fetchSeasonEpisodes = async (seasonNum: number) => {
    setLoadingEpisodes(true);
    setEpisodeError(null);
    try {
      const response = await fetch(`/api/tv/${tmdbId}/season/${seasonNum}`);
      if (!response.ok) {
        throw new Error("Failed to load season details from proxy.");
      }
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (err: any) {
      console.error("Error fetching season episodes:", err);
      setEpisodeError("Could not connect to the database node to load episodes.");
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Generate Stream URLs based on selection
  const getEmbedUrl = () => {
    const finalImdb = imdbId || "tt1375666"; // Fallback to IMDb ID if missing just for demonstration
    
    if (selectedServer === "embedmstr") {
      if (isShow) {
        return `https://embedmaster.link/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
      } else {
        return `https://embedmaster.link/movie/${tmdbId}`;
      }
    } else if (selectedServer === "vidsrc") {
      // Direct VidSrc Player Link
      if (isShow) {
        return `https://vidsrc.me/embed/tv?imdb=${finalImdb}&season=${currentSeason}&episode=${currentEpisode}`;
      } else {
        return `https://vidsrc.me/embed/movie?imdb=${finalImdb}`;
      }
    } else {
      // EmbedSU / SuperEmbed - great fallback using TMDB ID
      if (isShow) {
        return `https://embed.su/embed/tv/${tmdbId}/${currentSeason}/${currentEpisode}`;
      } else {
        return `https://embed.su/embed/movie/${tmdbId}`;
      }
    }
  };

  return (
    <div className="bg-neutral-950/95 border-b border-cyan-500/20 py-8 px-4 md:px-12 relative">
      {/* Absolute Neon Ambient Backdrop Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Block with Control */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs uppercase text-cyan-400 tracking-widest px-2 py-0.5 border border-cyan-400/20 rounded bg-cyan-950/20">
                [ CINEMA LINK ESTABLISHED ]
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                STATION ID: #{item.id}
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-title font-black text-white uppercase tracking-tight">
              {title}
            </h2>
            {isShow && (
              <p className="text-xs font-mono text-purple-400 mt-1 uppercase">
                Now Streaming: S{currentSeason} • Ep {currentEpisode} — {episodes.find(e => e.episode_number === currentEpisode)?.name || "Interactive Unit"}
              </p>
            )}
          </div>

          <div id="player-headers-actions" className="flex items-center gap-3">
            {/* Server Multiplexer Selection button dashboard */}
            <div className="bg-neutral-900 border border-neutral-800 p-0.5 rounded flex items-center">
              <button
                id="btn-server-embedmstr"
                onClick={() => setSelectedServer("embedmstr")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  selectedServer === "embedmstr"
                    ? "bg-cyan-500 text-neutral-950"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Primary stream URL using embedmaster.link"
              >
                <Server className="w-3.5 h-3.5" />
                EmbedMaster
              </button>
              
              <button
                id="btn-server-vidsrc"
                onClick={() => setSelectedServer("vidsrc")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  selectedServer === "vidsrc"
                    ? "bg-purple-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Backup streaming source 1 (VidSrc)"
              >
                <Monitor className="w-3.5 h-3.5" />
                VidSrc
              </button>

              <button
                id="btn-server-embedsu"
                onClick={() => setSelectedServer("embedsu")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-all ${
                  selectedServer === "embedsu"
                    ? "bg-rose-600 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Backup streaming source 2 (Embed.su)"
              >
                <Layers className="w-3.5 h-3.5" />
                EmbedSU
              </button>
            </div>

            <a
              id="btn-open-new-tab"
              href={getEmbedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyan-800/60 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-950/60 hover:border-cyan-400 hover:text-cyan-300 transition-all text-xs font-mono font-bold"
              title="Open stream in a clean new tab to bypass sandbox limiters"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            <button
              id="btn-close-theater-node"
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-850 hover:border-rose-500 hover:bg-rose-950/25 text-neutral-400 hover:text-rose-400 transition-all duration-200"
              title="Close System Feed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DNS / Connection / Sandbox helper banner */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-950/20 border border-cyan-800/30 p-3.5 rounded-md text-xs font-mono text-cyan-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">[ CLIENT CONFIGURATION NOTICE: IFRAME SANDBOXING ]</p>
              <p className="text-neutral-400 mt-1 leading-relaxed">
                If the player displays a <span className="text-amber-400">"Sandbox detected"</span> warning or fails to load inside the secure workspace frame, please use the button to launch a clean, unrestricted server tab instantly.
              </p>
            </div>
          </div>
          <a
            href={getEmbedUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-bold rounded shadow-lg shadow-cyan-500/15 transition-all text-center"
          >
            <ExternalLink className="w-4 h-4" />
            Open Player In New Tab
          </a>
        </div>

        {/* Outer Frame with Glowing Shadow Case */}
        <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden border border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_30px_rgba(0,240,255,0.06)] group">
          {/* Active Broadcast Frame */}
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full absolute inset-0 bg-neutral-950"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
            scrolling="no"
          />

          {/* Fallback warning watermark for when IMDb ID might be unavailable */}
          {!imdbId && selectedServer === "embedmstr" && (
            <div className="absolute pointer-events-none bottom-3 left-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md px-3 py-1.5 rounded text-[11px] font-mono text-yellow-500 max-w-sm z-30 shadow-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No IMDb ID recorded. Fell back to simulation. Toggle server above if video fails.</span>
            </div>
          )}
        </div>

        {/* TV Series Episode Grid Drawer / Season Controllers */}
        {isShow && (
          <div className="mt-8 bg-neutral-900/60 border border-neutral-800/80 rounded-lg p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <ListVideo className="text-cyan-400 w-5 h-5" />
                <h3 className="font-title text-sm md:text-base font-bold tracking-wider text-neutral-200 uppercase">
                  Terminal Series Navigation
                </h3>
              </div>

              {/* Season Selection Array */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
                <span className="text-xs font-mono text-neutral-500 uppercase mr-1">Season</span>
                {Array.from({ length: item.number_of_seasons || 1 }, (_, i) => i + 1).map((sNum) => (
                  <button
                    key={sNum}
                    id={`btn-season-${sNum}`}
                    onClick={() => {
                      setCurrentSeason(sNum);
                      setCurrentEpisode(1);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                      currentSeason === sNum
                        ? "bg-cyan-500/10 border-cyan-400 text-cyan-400"
                        : "bg-neutral-850 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    S{sNum < 10 ? `0${sNum}` : sNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Scrolling Container */}
            {loadingEpisodes ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2" />
                <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                  Decrypting Episode Node logs...
                </p>
              </div>
            ) : episodeError ? (
              <div className="flex items-center justify-center py-8 gap-3 border border-dashed border-rose-500/20 rounded-md bg-rose-950/10 text-rose-400 text-xs font-mono">
                <AlertCircle className="w-4 h-4" />
                {episodeError}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-76 overflow-y-auto pr-1">
                {episodes.map((ep) => {
                  const isActive = ep.episode_number === currentEpisode;
                  const epStill = ep.still_path
                    ? `https://image.tmdb.org/t/p/w185${ep.still_path}`
                    : `https://images.unsplash.com/photo-1542204172-e7052809a86e?q=80&w=150&auto=format&fit=crop`;
                  
                  return (
                    <button
                      key={ep.id}
                      id={`btn-episode-${ep.episode_number}`}
                      onClick={() => setCurrentEpisode(ep.episode_number)}
                      className={`flex flex-col text-left p-2.5 rounded-md border transition-all duration-200 ${
                        isActive
                          ? "bg-cyan-950/20 border-cyan-400 shadow-[inset_0_0_12px_rgba(0,240,255,0.05)]"
                          : "bg-neutral-900/40 border-neutral-850 hover:bg-neutral-850/50 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="relative shrink-0 w-20 aspect-video rounded overflow-hidden bg-neutral-950">
                          <img
                            src={epStill}
                            alt={ep.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30" />
                          <div className="absolute bottom-1 right-1 font-mono text-[8px] bg-black/80 px-1 py-0.5 rounded text-neutral-300">
                            EP {ep.episode_number}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold line-clamp-1 ${isActive ? "text-cyan-400" : "text-neutral-200"}`}>
                            {ep.name || `Episode ${ep.episode_number}`}
                          </h4>
                          <span className="block text-[9px] font-mono text-neutral-500 mt-0.5">
                            Broadcast: {ep.air_date || "Unknown Epoch"}
                          </span>
                        </div>
                      </div>
                      
                      {ep.overview && (
                        <p className="text-[10px] text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {ep.overview}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
