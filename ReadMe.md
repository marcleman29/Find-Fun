# Find-Fun

A mobile app that aggregates Google reviews for any location and surfaces the best things to do, places to visit, and places to eat — cutting through generic star ratings to find what's actually worth your time.

## Core Idea
Type in a location → get curated, high-signal recommendations pulled from Google review data, ranked by genuine quality rather than raw review count.

## Features (planned)
- Location search (city, neighborhood, or address)
- Categorized results: Things to Do / Places to Visit / Places to Eat
- Smart ranking beyond simple star average (review recency, review depth, keyword sentiment)
- Review snippet highlights per place
- Save/favorite places for a trip

## Tech Stack
- **Framework:** React Native (Expo)
- **Data source:** Google Maps/Local results via [SerpApi](https://serpapi.com) (`google_maps` + `google_maps_reviews` engines) — not Google's own Places API directly
- **Backend:** Node/Express server (`server/`) that fetches places via SerpApi, proxies ranking requests to Qwen, and caches both
- **State management:** TBD

## Status
🚧 Early development — Expo scaffold in place. Falls back to mock data and a local ranking heuristic when SerpApi or Qwen aren't configured.

## Roadmap
- [x] Set up Expo project scaffold
- [x] Places integration via SerpApi (with a mock-data fallback if unconfigured)
- [x] Build ranking algorithm for "best of" filtering (Qwen-backed, with a local fallback)
- [x] Design UI for search + results
- [x] Category filtering (food / activities / attractions)

## Project Structure
- `app/` — expo-router screens: `(tabs)/index.tsx` (search + results), `(tabs)/saved.tsx` (favorites), `place/[id].tsx` (place detail)
- `components/` — `LocationSearchBar`, `CategoryPills`, `PlaceCard`
- `contexts/FavoritesContext.tsx` — in-memory favorite/save state
- `lib/places.ts` — calls the server's `/api/places` endpoint for real places; falls back to mock data on any failure
- `lib/aiRecommendations.ts` — calls the server's `/api/recommendations` endpoint for Qwen-ranked results
- `lib/ranking.ts` — local quality-score fallback (recency-weighted rating × review depth), used if the server or Qwen is unavailable
- `data/mockPlaces.ts` — placeholder dataset shaped like the real places/reviews response, used whenever `/api/places` isn't available
- `server/` — Express API with two endpoints (see below): `/api/places` (SerpApi-backed places lookup) and `/api/recommendations` (Qwen ranking)

## Running locally

**App:**
```
npm install
npm run start   # then press i/a/w, or scan the QR code in Expo Go
```

**Server** (for real places + Qwen-ranked results):
```
cd server
npm install
cp .env.example .env
# then set HF_TOKEN (Hugging Face access token) and/or SERPAPI_KEY
npm start
```
Each integration degrades independently and the app stays usable without either configured:
- No `SERPAPI_KEY` (or the request fails) → falls back to the bundled mock dataset in `data/mockPlaces.ts`.
- No `HF_TOKEN` (or the request fails) → falls back to the local ranking heuristic in `lib/ranking.ts`.

Getting a SerpApi key: sign up at [serpapi.com](https://serpapi.com), grab the API key from your account dashboard. Each place search + its review fetches count against your plan's search quota — the server caches Places responses for 6 hours per location/category to limit repeat calls.

By default the app points at `http://localhost:3000`. This works for the iOS Simulator and web, but **not** for a physical device or Expo Go over the network — `localhost` there resolves to the device itself. In that case, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (shown when you run `npm run start`), e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:3000 npm run start`.

## Deploying the server (so a built/installed app can reach it)

A locally-run server only works for the Simulator or devices on the same LAN. For an installed APK (or anyone outside your network) to get real results, `server/` needs to run somewhere with a public URL.

**Render** (`render.yaml` in the repo root is a ready-made Blueprint):
1. Push this repo to GitHub (already done) and sign up at [render.com](https://render.com).
2. **New → Blueprint**, connect this repo. Render reads `render.yaml` and proposes a `find-fun-server` web service rooted at `server/`.
3. When prompted, paste in `HF_TOKEN` and `SERPAPI_KEY` (marked `sync: false` in the blueprint so they're never committed to git).
4. Deploy. Render gives you a public URL like `https://find-fun-server.onrender.com`.
5. Update `eas.json`'s `preview` build profile with `"env": { "EXPO_PUBLIC_API_BASE_URL": "https://find-fun-server.onrender.com" } }`, then rebuild the APK (`eas build --platform android --profile preview`) so it's baked into the bundle — `EXPO_PUBLIC_*` vars are inlined at build time, not read at runtime, so a URL change always needs a rebuild.

Note: Render's free tier spins the service down after inactivity, so the first request after a while will be slow (a "cold start") while it wakes back up.
