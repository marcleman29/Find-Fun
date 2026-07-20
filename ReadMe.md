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
- **Data source:** Google Places API (New) — Text Search + Place Details for reviews
- **Backend:** Node/Express server (`server/`) that fetches places from Google, proxies ranking requests to Qwen, and caches both
- **State management:** TBD

## Status
🚧 Early development — Expo scaffold in place. Falls back to mock data and a local ranking heuristic when the Places API or Qwen aren't configured.

## Roadmap
- [x] Set up Expo project scaffold
- [x] Google Places API integration (with a mock-data fallback if unconfigured)
- [x] Build ranking algorithm for "best of" filtering (Qwen-backed, with a local fallback)
- [x] Design UI for search + results
- [x] Category filtering (food / activities / attractions)

## Project Structure
- `app/` — expo-router screens: `(tabs)/index.tsx` (search + results), `(tabs)/saved.tsx` (favorites), `place/[id].tsx` (place detail)
- `components/` — `LocationSearchBar`, `CategoryPills`, `PlaceCard`
- `contexts/FavoritesContext.tsx` — in-memory favorite/save state
- `lib/places.ts` — calls the server's `/api/places` endpoint for real Google-sourced places; falls back to mock data on any failure
- `lib/aiRecommendations.ts` — calls the server's `/api/recommendations` endpoint for Qwen-ranked results
- `lib/ranking.ts` — local quality-score fallback (recency-weighted rating × review depth), used if the server or Qwen is unavailable
- `data/mockPlaces.ts` — placeholder dataset shaped like the real Places/Reviews API response, used whenever `/api/places` isn't available
- `server/` — Express API with two endpoints (see below): `/api/places` (Google Places lookup) and `/api/recommendations` (Qwen ranking)

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
# then set HF_TOKEN (Hugging Face access token) and/or GOOGLE_PLACES_API_KEY
npm start
```
Each integration degrades independently and the app stays usable without either configured:
- No `GOOGLE_PLACES_API_KEY` (or the request fails) → falls back to the bundled mock dataset in `data/mockPlaces.ts`.
- No `HF_TOKEN` (or the request fails) → falls back to the local ranking heuristic in `lib/ranking.ts`.

Getting a Google Places API key: in Google Cloud Console, enable **"Places API (New)"** on a project with billing enabled, then create an API key under Credentials (restrict it to the Places API). Text Search + Place Details are billed per request — the server caches Places responses for 6 hours per location/category to limit repeat calls.

By default the app points at `http://localhost:3000`. This works for the iOS Simulator and web, but **not** for a physical device or Expo Go over the network — `localhost` there resolves to the device itself. In that case, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (shown when you run `npm run start`), e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:3000 npm run start`.
