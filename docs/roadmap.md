# Rimjhim Roams — Phased Roadmap

This roadmap outlines the phased development plan for Rimjhim Roams (TripWise AI Travel OS), ensuring production quality, performance, and compliance with free-tier constraints.

---

## Phase 1: Foundation & Architecture Setup (Current Phase)
- [x] Initial repository audit and stack confirmation.
- [x] Next.js 14 + TypeScript + Tailwind CSS configuration.
- [x] Design system setup (shadcn/ui primitives: Button, Card, Badge).
- [x] Core domain type modeling (`travel.ts`, `database.ts`).
- [x] Integration stubs for Gemini AI, Supabase SSR, Open-Meteo weather, and OSRM routing.
- [x] Environment template (`.env.example`) and architecture documentation.
- [x] Local verification (`npm install`, `npm run build`, `npm test`).

---

## Phase 2: Authentication & User Profiles
- [ ] Supabase Auth integration (Email/Password & Google OAuth).
- [ ] Protected route middleware (`/trips`, `/saved`).
- [ ] User profile and preferences onboarding (travel style, dietary needs, budget affinity).

---

## Phase 3: AI Trip Generation Engine
- [ ] Structured Prompt engineering with Gemini 1.5 Flash using JSON Schema output mode.
- [ ] Multi-day itinerary synthesis with activity clustering by neighborhood to minimize travel fatigue.
- [ ] Budget estimation calculations and cost allocation.
- [ ] Streaming response support for fast user perceived latency.

---

## Phase 4: Geospatial Routing & Weather Overlay
- [ ] Leaflet dynamic map component with OpenStreetMap tiles and custom markers.
- [ ] OSRM road geometry drawing for daily driving/walking routes.
- [ ] Open-Meteo weather forecast widgets tied to itinerary dates and destination coordinates.
- [ ] PostGIS spatial indexing in Supabase for nearby recommendations.

---

## Phase 5: Semantic Discovery & Vector Search
- [ ] Embedding generation for curated points of interest (POIs).
- [ ] pgvector cosine similarity search (`match_places` stored procedure).
- [ ] Natural language search (e.g. "cafes with good wifi and quiet courtyard").

---

## Phase 6: Production Polish & Vercel Deployment
- [ ] Edge caching and Incremental Static Regeneration (ISR) for popular travel guides.
- [ ] End-to-end testing and lighthouse performance optimization.
- [ ] Vercel one-click deployment verification and continuous integration setup.
