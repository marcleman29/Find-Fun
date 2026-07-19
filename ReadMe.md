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
- **Backend:** TBD (likely a lightweight API to handle ranking logic and cache results)
- **State management:** TBD

## Status
🚧 Early planning stage — repo just initialized.

## Roadmap
- [ ] Set up Expo project scaffold
- [ ] Google Places API integration
- [ ] Build ranking algorithm for "best of" filtering
- [ ] Design UI for search + results
- [ ] Category filtering (food / activities / attractions)
