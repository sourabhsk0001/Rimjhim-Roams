# Rimjhim Roams — Phased Roadmap

This roadmap outlines the phased development plan for Rimjhim Roams (TripWise AI Travel OS), ensuring production quality, performance, and compliance with free-tier constraints.

---

## Phase 1: Security Foundation & Trip CRUD (Completed)
- [x] Initial repository audit and stack confirmation.
- [x] Next.js 14 + TypeScript + Tailwind CSS configuration with shadcn/ui.
- [x] Supabase Auth, SSR session handling, and protected route middleware.
- [x] User profiles, traveller profiles, and travel preferences data models.
- [x] Trips CRUD with validation, error states, and automatic "destination discovery required" fallback.
- [x] Database migrations with Row Level Security (RLS) policies.
- [x] 12 unit tests for authentication protection, CRUD, authorization, and validation.

---

## Phase 2: Core Travel Data System & PostGIS Catalog (Completed)
- [x] Database models and migrations for destinations, attractions, hotels, restaurants, transport, taxis, and reviews.
- [x] Latitude and longitude support with stored PostGIS `geography(Point, 4326)` columns.
- [x] GIST spatial indexes and `find_nearby_attractions` PostGIS stored procedure.
- [x] Rich DEMO seed data for 8 major Indian travel hubs: Goa, Jaipur, Darjeeling, Delhi, Mumbai, Kolkata, Manali, and Bengaluru.
- [x] Full operational fields: opening hours, ticket prices, visit durations, weather suitability, queue estimates, and dietary options.
- [x] REST API endpoints:
  - `GET /api/destinations` (with search and climate filter)
  - `GET /api/destinations/nearby` (PostGIS spatial radius search)
  - `GET /api/destinations/:id`
  - `GET /api/destinations/:id/attractions`
  - `GET /api/destinations/:id/hotels`
  - `GET /api/destinations/:id/restaurants`
  - `GET /api/destinations/:id/transport`
- [x] Frontend discovery experiences:
  - `/explore`: Searchable destination directory with climate filtering.
  - `/explore/destinations/[id]`: Multi-tab guide with attractions, lodging, dining, transit, and interactive PostGIS radius query tool.
- [x] Explicit DEMO DATA badges across all cards and detail views.
- [x] 11 additional unit tests for catalog search, filtering, operational schemas, and Haversine distance calculations (23 tests total).

---

## Phase 3: Real Geospatial Functionality & Routing (Completed)
- [x] Interactive Leaflet + OpenStreetMap canvas component with client/server SSR boundary protection (`next/dynamic` with `{ ssr: false }`).
- [x] Custom zero-asset SVG pin markers with semantic color coding (Destination, Attractions, Hotels, Restaurants).
- [x] Reusable `RoutingProvider` abstraction with `OSMRoutingProvider` implementation:
  - `calculateRoute()`
  - `calculateDistance()`
  - `calculateTravelTime()`
- [x] Multi-mode route calculation:
  - `driving` (OSRM road geometry & driving speeds)
  - `walking` (pace-adjusted travel times ~4.5 km/h)
  - `cycling` (pace-adjusted travel times ~15 km/h)
- [x] Resilient error handling, AbortController timeouts, and coordinate validation with graceful fallback to Haversine straight-line paths.
- [x] `POST /api/geo/route` API endpoint for on-demand routing between waypoints.
- [x] Destination detail page map integration with interactive waypoint selection, route mode switcher, and live route summary.
- [x] 9 unit tests for coordinate validation, Haversine distances, routing modes, and fallback degradation (32 tests total).

---

## Phase 4: Deterministic Travel Budget & Optimization Engine (Completed)
- [x] Integer minor units architecture guaranteeing zero floating-point currency drift (1 INR = 100 paise).
- [x] Dedicated `BudgetEngine` with 9 deterministic calculation functions:
  - `calculateTransportCost()`
  - `calculateHotelCost()`
  - `calculateFoodCost()`
  - `calculateLocalTransportCost()`
  - `calculateActivityCost()`
  - `calculateEmergencyBuffer()`
  - `calculateTripCost()`
  - `calculateRemainingBudget()`
  - `calculateOverBudget()`
- [x] Strict budget categories:
  - `transport`, `hotel`, `food`, `local_transport`, `activities`, `shopping`, `emergency_buffer`, `other`
- [x] 4 rule-based optimization profiles:
  - `Budget Saver`, `Time Saver`, `Experience Maximizer`, `Balanced`
- [x] Deterministic alternative generation:
  - Cheaper hotel, cheaper transport, different transport mode, cheaper restaurant, remove low-priority activity, replace activity, optimize route.
  - Clear metrics: current cost, proposed cost, possible savings, and explicit trade-offs.
  - Interactive Accept/Reject workflow updating projected costs in real time.
- [x] Database migration and models for `price_snapshots` and `expenses` with RLS.
- [x] Interactive frontend page: `/trips/[tripId]/budget` with KPIs, breakdown, alternatives, and expense ledger.
- [x] 18 unit tests covering precision, calculations, profiles, alternatives, and expense ledger (50 tests total).

---

## Phase 5: AI Itinerary Synthesis Engine (Next Phase)
- [ ] Structured Prompt engineering with Gemini 1.5 Flash using JSON Schema output mode.
- [ ] Multi-day itinerary synthesis clustering activities by neighborhood to minimize travel fatigue.
- [ ] Integration of BudgetEngine output into AI synthesis prompts to enforce financial constraints.
- [ ] Streaming response support for low perceived latency.

---

## Phase 6: Weather Forecast & Environmental Intelligence
- [ ] Open-Meteo meteorological integration (7-day forecast, temperature, rain probability).
- [ ] Destination weather widgets tied to travel dates and GPS coordinates.
- [ ] Weather-informed attraction scheduling recommendations (indoor vs outdoor activities).

---

## Phase 7: Semantic Discovery & Vector Search
- [ ] Embedding generation for curated points of interest (POIs).
- [ ] pgvector cosine similarity search (`match_places` stored procedure).
- [ ] Natural language search (e.g. "cafes with good wifi and quiet courtyard").

---

## Phase 8: Production Polish & Vercel Deployment
- [ ] Edge caching and Incremental Static Regeneration (ISR) for popular travel guides.
- [ ] End-to-end testing and lighthouse performance optimization.
- [ ] Vercel one-click deployment verification and continuous integration setup.
