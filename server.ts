import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;
const HOST = "0.0.0.0";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "35ee82bcad013e6a6237a0a087d7eb32";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Helper for TMDB fetch requests
async function fetchFromTMDB(endpoint: string, queryParams: Record<string, string> = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY);
  
  // Use English language by default
  url.searchParams.append("language", "en-US");
  
  Object.entries(queryParams).forEach(([key, val]) => {
    url.searchParams.append(key, val);
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from TMDB endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Enable JSON parser for potential POST endpoints
app.use(express.json());

// API: Trending items
app.get("/api/trending", async (req, res) => {
  const mediaType = req.query.type as string || "movie"; // movie, tv, all
  const timeWindow = req.query.time as string || "day"; // day, week
  try {
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch trending data" });
  }
});

// API: Search multi-search (movie, tv)
app.get("/api/search", async (req, res) => {
  const query = req.query.query as string;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  const page = req.query.page as string || "1";
  try {
    const data = await fetchFromTMDB("/search/multi", { query, page });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process search" });
  }
});

// API: Movie details with extra attributes (credits, videos, similar, external_ids)
app.get("/api/movie/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await fetchFromTMDB(`/movie/${id}`, {
      append_to_response: "credits,videos,similar,external_ids"
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || `Failed to fetch movie ${id}` });
  }
});

// API: TV details with extra attributes (credits, videos, similar, external_ids)
app.get("/api/tv/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const data = await fetchFromTMDB(`/tv/${id}`, {
      append_to_response: "credits,videos,similar,external_ids"
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || `Failed to fetch TV show ${id}` });
  }
});

// API: TV Season Details (to get episodes)
app.get("/api/tv/:id/season/:season", async (req, res) => {
  const id = req.params.id;
  const season = req.params.season;
  try {
    const data = await fetchFromTMDB(`/tv/${id}/season/${season}`);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || `Failed to fetch season ${season} for tv show ${id}` });
  }
});

// API: Genres list (returns combined or separate movie and tv genres)
app.get("/api/genres", async (req, res) => {
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      fetchFromTMDB("/genre/movie/list"),
      fetchFromTMDB("/genre/tv/list")
    ]);
    res.json({
      movie: movieGenres.genres || [],
      tv: tvGenres.genres || []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch genre list" });
  }
});

// API: Discover movies/tv based on custom TMDB search rules (genres, sorting)
app.get("/api/discover", async (req, res) => {
  const mediaType = req.query.type as string || "movie"; // movie or tv
  const withGenres = req.query.genres as string || "";
  const sortBy = req.query.sort_by as string || "popularity.desc";
  const page = req.query.page as string || "1";
  
  try {
    const data = await fetchFromTMDB(`/discover/${mediaType}`, {
      with_genres: withGenres,
      sort_by: sortBy,
      page
    });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to discover content" });
  }
});

// Initialize Vite server for HMR/Asset bundle or static serving in production
async function main() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production, serving static assets from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server launched successfully at http://${HOST}:${PORT}/`);
    console.log(`Using TMDB config with key: ${TMDB_API_KEY.slice(0, 4)}...${TMDB_API_KEY.slice(-4)}`);
  });
}

main().catch((err) => {
  console.error("Critical error starting Express server:", err);
  process.exit(1);
});
