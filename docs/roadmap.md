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
  - `calculateTransportCost()`, `calculateHotelCost()`, `calculateFoodCost()`, `calculateLocalTransportCost()`, `calculateActivityCost()`, `calculateEmergencyBuffer()`, `calculateTripCost()`, `calculateRemainingBudget()`, `calculateOverBudget()`.
- [x] Strict budget categories:
  - `transport`, `hotel`, `food`, `local_transport`, `activities`, `shopping`, `emergency_buffer`, `other`.
- [x] 4 rule-based optimization profiles:
  - `Budget Saver`, `Time Saver`, `Experience Maximizer`, `Balanced`.
- [x] Deterministic alternative generation with trade-offs & live Accept/Reject workflow.
- [x] Database migration and models for `price_snapshots` and `expenses` with RLS.
- [x] Interactive frontend page: `/trips/[tripId]/budget`.
- [x] 18 unit tests (50 tests total).

---

## Phase 5: TripWise Time Intelligence Engine (Completed)
- [x] Strict architectural invariant: discrete, unmerged time fields (`visit_minutes`, `travel_minutes`, `waiting_minutes`, `buffer_minutes`) NEVER combined internally.
- [x] Dedicated `TimeEngine` with 7 core time functions:
  - `calculateVisitDuration()` (with Quick, Normal, Relaxed tiers, pace, traveller type, weather, and sunset viewpoints)
  - `calculateTravelDuration()` (exact point-to-point transit minutes)
  - `calculateWaitingTime()` (peak vs off-peak congestion modeling)
  - `calculateBuffer()` (contingency and transition margins)
  - `calculateDailyAvailableTime()` (net free waking hours)
  - `validateDailySchedule()` (detects closed sights, insufficient visit time, overlaps, impossible transit, excessive exhaustion)
  - `calculateTotalTimeAllocation()` (discrete breakdown across available, travel, sightseeing, food, rest, waiting, buffer)
- [x] "Optimize Day" algorithm resolving opening hour conflicts, reordering sights by proximity, inserting lunch/rest blocks, and eliminating impossible conditions.
- [x] Database tables and migration for `itineraries`, `itinerary_items`, and `route_segments` with RLS.
- [x] Interactive frontend page: `/trips/[tripId]/itinerary` with day selector, chronological timeline, discrete time blocks, transit indicators, and live Optimize Day.
- [x] 15 unit tests covering time precision, tiers, feasibility validation, and day optimization (65 tests total).

---

## Phase 6: Connected Deterministic Trip Planner (Completed)
- [x] Created `TripPlannerService` connecting catalog data, routing, time intelligence, and budget engine into one unified deterministic planning pipeline.
- [x] End-to-end 10-stage planning pipeline:
  - Trip requirements resolution → Destination verification
  - Candidate hotels selection & scoring based on group size, nights, and target lodging budget
  - Candidate attractions selection respecting pace (`relaxed`, `moderate`, `fast`), duration tiers, and queue congestion
  - Candidate restaurants selection for lunches and dinners respecting dietary preferences
  - Transport selection (outbound, return, and local mobility)
  - Geospatial clustering & routing
  - Time calculation with strict discrete unmerged fields (`visit_minutes`, `travel_minutes`, `waiting_minutes`, `buffer_minutes`), opening/closing hours verification, and physical feasibility validation
  - Deterministic budget calculation across 8 categories (minor-unit precision)
  - Automatic deterministic optimization when budget is exceeded (hotel, transit, dining, and local transit alternatives)
  - Complete itinerary assembly and persistence to database and in-memory cache
- [x] REST API endpoint: `POST /api/trips/[id]/plan` and `GET /api/trips/[id]/plan`.
- [x] Frontend trip experience on `/trips/[id]`:
  - "Generate My Complete Trip" action button
  - Animated 6-stage progress tracker: Finding places → Finding hotel → Calculating transport → Optimizing route → Calculating budget → Building itinerary
  - 8-part comprehensive trip view: Overview, Interactive Leaflet Map, Day Timeline, Budget, Hotels, Transport, Food, Attractions
- [x] 11 comprehensive unit & end-to-end tests for the complete planning pipeline (76 tests total).

---

## Phase 7: Destination Discovery Engine (Completed)
- [x] Created `DestinationDiscoveryEngine` pipeline allowing users to discover feasible travel destinations without knowing where to go in advance.
- [x] Multi-stage discovery pipeline:
  - Input: Origin + Budget + Duration + Traveller profile + Preferences
  - Filters out origin departure hub from candidate destinations
  - Estimates intercity transport fares (direct catalog or distance-based transit physics)
  - Evaluates accommodations dynamically matching target lodging budget
  - Calculates Food, Local Transport, Activities, and Emergency Buffer using deterministic `BudgetEngine`
  - Infeasibility filtering (eliminates cost infeasible destinations exceeding budget ceiling or impossible transit-to-duration ratios)
  - Thematic preference matching & scoring (Nature, Adventure, Heritage, Beaches, Food)
  - Fetches Open-Meteo live or seasonal climatological weather forecasts with resilient timeout protection
- [x] Detailed destination response schema:
  - `destination`, `estimatedTotalCost`, `transportCost`, `hotelCost`, `foodCost`, `activitiesCost`, `localTransportCost`, `emergencyBufferCost`, `recommendedDays`, `approximateTravelTime`, `travelModeSummary`, `majorAttractions`, `weather`, and explicit `DEMO ESTIMATE / INDICATIVE PRICING` disclaimer.
- [x] REST API endpoint: `POST /api/destinations/discover`.
- [x] Interactive Frontend Widget:
  - "FIND WHERE I SHOULD GO" interactive planner on Home page (`src/app/page.tsx`)
  - Departure city, budget counter, duration stepper, traveller/group selector, and preference chips
  - Result cards with match score badges, budget surplus/deficit pills, weather indicators, cost breakdown drawers, and deep links to `/trips/new`
- [x] Pre-populated trip creation link via `/trips/new?origin=...&destination=...&budget=...`.
- [x] 6 unit & end-to-end tests validating prompt scenario (Kolkata, ₹20,000, 5 Days, 3 Friends, Nature + Adventure), BudgetEngine arithmetic integrity, origin filtering, budget constraint filtering, and preference scoring (82 tests total across all 7 phases).

---

## Phase 8: AI Itinerary Synthesis Engine (Next Phase)
- [ ] Structured Prompt engineering with Gemini 1.5 Flash using JSON Schema output mode.
- [ ] Feeding deterministic TimeEngine, RoutingProvider, and BudgetEngine bounds into Gemini prompts.
- [ ] Thematic narrative generation and cultural contextualization within strict physical limits.
- [ ] Streaming response support for low perceived latency.

---

## Phase 9: Semantic Discovery & Vector Search
- [ ] Embedding generation for curated points of interest (POIs).
- [ ] pgvector cosine similarity search (`match_places` stored procedure).
- [ ] Natural language search (e.g. "cafes with good wifi and quiet courtyard").

---

## Phase 10: Production Polish & Vercel Deployment
- [ ] Edge caching and Incremental Static Regeneration (ISR) for popular travel guides.
- [ ] End-to-end testing and lighthouse performance optimization.
- [ ] Vercel one-click deployment verification and continuous integration setup.
