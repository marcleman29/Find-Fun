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
- **Backend:** Node/Express server (`server/`) that fetches places via SerpApi, proxies ranking requests to Qwen, enforces auth/quotas, and caches all of it
- **Auth & database:** [Supabase](https://supabase.com) (email/password auth + Postgres for subscription tier and usage tracking)
- **State management:** TBD

## Status
🚧 Early development — Expo scaffold in place, account required to use it. Falls back to mock data and a local ranking heuristic when SerpApi or Qwen aren't configured; the paid endpoints require Supabase auth to be configured at all.

## Roadmap
- [x] Set up Expo project scaffold
- [x] Places integration via SerpApi (with a mock-data fallback if unconfigured)
- [x] Build ranking algorithm for "best of" filtering (Qwen-backed, with a local fallback)
- [x] Design UI for search + results
- [x] Category filtering (food / activities / attractions)
- [x] User accounts (Supabase auth) + per-user monthly search quotas, ahead of subscription tiering

## Project Structure
- `app/` — expo-router screens: `(auth)/sign-in.tsx` (login/signup, shown when logged out), `(tabs)/index.tsx` (search + results), `(tabs)/saved.tsx` (favorites + sign out), `place/[id].tsx` (place detail)
- `components/` — `LocationSearchBar`, `CategoryPills`, `PlaceCard`
- `contexts/AuthContext.tsx` — Supabase session state, sign in/up/out
- `contexts/FavoritesContext.tsx` — in-memory favorite/save state
- `lib/supabase.ts` — Supabase client with AsyncStorage-backed session persistence
- `lib/places.ts` — calls the server's `/api/places` endpoint (with the user's auth token) for real places; falls back to mock data on any failure
- `lib/aiRecommendations.ts` — calls the server's `/api/recommendations` endpoint (with the user's auth token) for Qwen-ranked results
- `lib/ranking.ts` — local quality-score fallback (recency-weighted rating × review depth), used if the server or Qwen is unavailable
- `data/mockPlaces.ts` — placeholder dataset shaped like the real places/reviews response, used whenever `/api/places` isn't available
- `server/` — Express API with two paid-API-backed endpoints (see below): `/api/places` (SerpApi-backed places lookup) and `/api/recommendations` (Qwen ranking), both requiring a valid Supabase session and rate-limited per-IP and per-user
- `server/src/auth.js` — verifies the Supabase session token and enforces monthly quotas
- `server/supabase/schema.sql` — one-time SQL migration for the `profiles`/`usage_periods` tables and quota-increment function

## Running locally

**App:**
```
npm install
cp .env.example .env
# set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see Auth section below)
npm run start   # then press i/a/w, or scan the QR code in Expo Go
```
The app requires an account (email/password) — there's no anonymous/guest mode. This is intentional: it's what lets per-user quotas and, later, subscription tiers work cleanly.

**Server** (places + Qwen ranking + auth):
```
cd server
npm install
cp .env.example .env
# then set HF_TOKEN, SERPAPI_KEY, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY
npm start
```
Each of these degrades independently — nothing crashes if one is missing, but the paid endpoints won't work at all without Supabase configured, since a valid session is required before anything else runs:
- No `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` → `/api/places` and `/api/recommendations` return a clean 503 regardless of the other keys (auth is checked first).
- No `SERPAPI_KEY` (or the request fails) → falls back to the bundled mock dataset in `data/mockPlaces.ts`.
- No `HF_TOKEN` (or the request fails) → falls back to the local ranking heuristic in `lib/ranking.ts`.

Getting a SerpApi key: sign up at [serpapi.com](https://serpapi.com), grab the API key from your account dashboard. Each place search + its review fetches count against your plan's search quota — the server caches Places responses for 6 hours per location/category to limit repeat calls.

By default the app points at `http://localhost:3000`. This works for the iOS Simulator and web, but **not** for a physical device or Expo Go over the network — `localhost` there resolves to the device itself. In that case, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (shown when you run `npm run start`), e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:3000 npm run start`.

## Auth & quotas (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, paste and run `server/supabase/schema.sql` once. This creates `profiles` (per-user subscription tier, default `'free'`) and `usage_periods` (monthly search counts), an atomic `increment_usage()` function the server calls to enforce quotas without a race condition, and a trigger that gives every new signup a profile row automatically.
3. In **Project Settings → API**, copy three values:
   - **Project URL** and **anon/public key** → go in the app (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`; safe to embed client-side by Supabase's design, since access is enforced by row-level security, not by keeping this secret).
   - **service_role key** → server only (`SUPABASE_SERVICE_ROLE_KEY`), never sent to the app. This key bypasses row-level security, so it must never end up in client code or a committed file.
4. By default, Supabase requires email confirmation before a new signup can log in — check your inbox after signing up, or turn "Confirm email" off in **Authentication → Providers → Email** for faster local testing.
5. Free tier is capped at 30 searches/month (`TIER_LIMITS` in `server/src/auth.js`); a `paid` tier exists in the schema at a higher limit but nothing sets it yet — that's wired up once subscription billing (e.g. RevenueCat + Play Billing) exists to actually charge for it.

## Deploying the server (so a built/installed app can reach it)

A locally-run server only works for the Simulator or devices on the same LAN. For an installed APK (or anyone outside your network) to get real results, `server/` needs to run somewhere with a public URL.

**Render** (`render.yaml` in the repo root is a ready-made Blueprint):
1. Push this repo to GitHub (already done) and sign up at [render.com](https://render.com).
2. **New → Blueprint**, connect this repo. Render reads `render.yaml` and proposes a `find-fun-server` web service rooted at `server/`.
3. When prompted, paste in `HF_TOKEN`, `SERPAPI_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` (all marked `sync: false` in the blueprint so they're never committed to git).
4. Deploy. Render gives you a public URL like `https://find-fun-server.onrender.com`.
5. Update `eas.json`'s `preview` build profile `env` block with `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`, and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, then rebuild the APK (`eas build --platform android --profile preview`) so they're baked into the bundle — `EXPO_PUBLIC_*` vars are inlined at build time, not read at runtime, so any change here always needs a rebuild.

If you already have a Render service deployed from an earlier version of `render.yaml` (before the Supabase vars were added), it won't pick up the two new ones automatically — go to the service's **Environment** tab in Render's dashboard and add `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` manually, or use Render's Blueprints "Sync" action.

Note: Render's free tier spins the service down after inactivity, so the first request after a while will be slow (a "cold start") while it wakes back up.
