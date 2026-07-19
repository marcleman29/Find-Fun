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
- **Data source:** Google Places API + Google Reviews
- **Backend:** Node/Express server (`server/`) that proxies ranking requests to Qwen and caches results
- **State management:** TBD

## Status
🚧 Early development — Expo scaffold in place, running on mock data, ranked by Qwen.

## Roadmap
- [x] Set up Expo project scaffold
- [ ] Google Places API integration
- [x] Build ranking algorithm for "best of" filtering (Qwen-backed, with a local fallback; mock data)
- [x] Design UI for search + results (initial version, mock data)
- [x] Category filtering (food / activities / attractions)

## Project Structure
- `app/` — expo-router screens: `(tabs)/index.tsx` (search + results), `(tabs)/saved.tsx` (favorites), `place/[id].tsx` (place detail)
- `components/` — `LocationSearchBar`, `CategoryPills`, `PlaceCard`
- `contexts/FavoritesContext.tsx` — in-memory favorite/save state
- `lib/aiRecommendations.ts` — calls the server's `/api/recommendations` endpoint for Qwen-ranked results
- `lib/ranking.ts` — local quality-score fallback (recency-weighted rating × review depth), used if the server or Qwen is unavailable
- `data/mockPlaces.ts` — placeholder dataset shaped like the future Places/Reviews API response
- `server/` — Express API that sends candidate places + reviews to Qwen and returns a ranked, reasoned recommendation list (see below)

## Running locally

**App:**
```
npm install
npm run start   # then press i/a/w, or scan the QR code in Expo Go
```

**Recommendations server (for Qwen-ranked results):**
```
cd server
npm install
cp .env.example .env   # then set QWEN_API_KEY to a DashScope API key
npm start
```
Without a running server (or without `QWEN_API_KEY` set), the app falls back automatically to the local heuristic ranking in `lib/ranking.ts` — search still works, just without AI ranking or highlights.

By default the app points at `http://localhost:3000`. This works for the iOS Simulator and web, but **not** for a physical device or Expo Go over the network — `localhost` there resolves to the device itself. In that case, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (shown when you run `npm run start`), e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:3000 npm run start`.
