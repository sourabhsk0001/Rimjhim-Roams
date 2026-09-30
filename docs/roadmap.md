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

## Phase 8: Weather Intelligence & Itinerary Integration (Completed)
- [x] Integrated real-time, forecast, and historical weather intelligence using Open-Meteo free API with robust fallback resilience.
- [x] Created `WeatherProvider` interface and `OpenMeteoWeatherProvider` implementation:
  - `getCurrentWeather(latitude, longitude)`
  - `getForecast(latitude, longitude, days)`
  - `getHistoricalDataIfAvailable(latitude, longitude, startDate, endDate)`
  - Explicit confidence tiers: `high_confidence` (0-2d), `moderate_confidence` (3-7d), and `seasonal_guidance` (>7d).
  - Unsafe weather claims guard with prominent probability-based advisory disclaimers.
  - Non-throwing timeout protection (`AbortSignal.timeout(2500)`) with safe climatological fallback.
- [x] Created `WeatherCacheManager` and `WeatherService`:
  - TTL-based memory caching (30m current, 2h forecast, 24h historical).
  - Database table and migration: `20241005000000_weather_snapshots.sql` with RLS.
  - `storeWeatherSnapshot()` and `getWeatherSnapshots()`.
- [x] Weather-Itinerary Conflict Detection & Resolution Engine:
  - Detects outdoor activities scheduled during rainy or adverse conditions ($\ge 50\%$ precipitation probability or heavy precipitation).
  - **Strategy 1 (Time Reschedule)**: Shifts outdoor activity to a dry daytime window on the same day (e.g. *Rain at 3 PM &rarr; Move beach from 3 PM to 5 PM*).
  - **Strategy 2 (Indoor Replacement)**: Replaces outdoor activities with indoor cultural/museum attractions when rain is continuous.
  - Dry-run preview vs persistent itinerary updates.
- [x] REST API endpoints:
  - `GET /api/trips/[id]/weather`: Live/cached forecast, weather snapshots, and detected conflicts.
  - `POST /api/trips/[id]/weather/integrate`: Resolves itinerary weather conflicts (supports `{ dryRun: boolean }`).
- [x] Interactive Frontend Experience:
  - `/trips/[id]/weather`: Dedicated weather dashboard displaying current temperature, feels-like, condition, rain probability, wind, humidity, and UV index.
  - Multi-day forecast cards with confidence tier badges.
  - Hourly forecast timeline with rain risk coloring.
  - **Itinerary Weather Shield**: Live conflict inspection with side-by-side fix recommendations and "Apply Weather Fixes" button.
  - Direct tab navigation between Overview, Time & Itinerary, Budget & Ledger, and Weather & Forecast.
- [x] 9 unit & end-to-end tests verifying provider methods, fallback resilience, caching, snapshot persistence, and prompt conflict resolution scenarios (91 tests total across all 8 phases).

---

## Phase 9: TripWise AI Travel Copilot (Completed)
- [x] Pluggable `AIModelProvider` abstraction decoupling model implementations from business logic:
  - `GeminiModelProvider` integrating Google Gemini API (`@google/generative-ai`) via structured function declarations (`SchemaType`).
  - `DeterministicCopilotProvider` offline-capable fallback ensuring zero test flakiness or broken builds when API keys are unset.
  - `getAIModelProvider()` factory for dynamic provider resolution.
- [x] Strict Invariant: Zero LLM Math or Raw DB Writes:
  - Architecture: `User → Gemini → Tool Selection → TripWise Backend Tool → Deterministic Service/Provider → Structured Result → Gemini → User Response`.
  - Authoritative math and database mutations strictly delegated to validated backend engines (`BudgetEngine`, `TimeEngine`, `RoutingProvider`, `WeatherService`, `TripPlannerService`).
- [x] Implemented 12 Deterministic Backend Tools with strict input/output schemas:
  1. `search_destinations`: Search cities by name, state, and climate.
  2. `search_hotels`: Filter by price, rating, and amenities.
  3. `search_transport`: Intercity routes and local taxi tariffs.
  4. `search_restaurants`: Budget limits per person and cuisine types.
  5. `search_attractions`: Operational hours, ticket pricing, and weather suitability.
  6. `get_weather`: Live conditions and multi-day meteorological forecasts.
  7. `calculate_route`: OSRM road geometry, distances, and transit modes.
  8. `calculate_budget`: Zero-drift minor-unit financial aggregation across 8 categories.
  9. `calculate_visit_duration`: Quick, Normal, Relaxed tiers adjusted for traveller pace.
  10. `optimize_itinerary`: Schedule rebalancing and validated attraction removal.
  11. `replan_trip`: Deterministic budget reduction and stay adjustments.
  12. `get_trip_context`: Hydrated trip details, scheduled items, budget, and weather.
- [x] Strict user authorization boundaries: Copilot verifies active user ownership for all trip-specific contexts.
- [x] REST API endpoint: `POST /api/copilot/chat` with session validation and multi-turn tool calling orchestration.
- [x] Frontend Experiences:
  - `/assistant`: Global travel copilot with value pillars, starter chips, and interactive tool console.
  - `/trips/[id]/assistant`: Trip-specific copilot with hydrated itinerary, budget, and weather context.
  - `CopilotChat`: Reusable conversational interface featuring tool execution badges, latency metrics, expandable JSON payload inspector, and "Apply Changes" action buttons.
  - Integrated "AI Copilot" links into global navigation and trip detail action groups.
- [x] 21 unit & end-to-end tests in `test/phase9.test.ts` verifying all 12 tools independently, strict authorization bounds, and required prompt scenarios (112 tests total across all 9 phases).

---

## Phase 10: PostgreSQL + pgvector Travel RAG System (Completed)
- [x] Zero Pinecone / Pure PostgreSQL + pgvector architecture utilizing free-tier Supabase primitives.
- [x] Database tables and migrations:
  - `public.knowledge_documents`: Stores parent documents, source attribution, categories, and destinations.
  - `public.knowledge_chunks`: Stores semantic text windows and 768-dimensional normalized vector embeddings (`vector(768)`).
  - Cosine distance index (`ivfflat` / vector_cosine_ops) and `match_knowledge_chunks` stored procedure.
- [x] Document Ingestion Pipeline:
  - Text cleaner: Normalizes unicode spaces, strips non-printable control codes and zero-width spaces.
  - Semantic sliding-window chunker: Splits on natural sentences/paragraphs (~500 chars with 80 char overlap).
  - 768-dimensional embedding generation: Uses Gemini `text-embedding-004` with unit-normalized semantic hash fallback for offline/test environments.
- [x] Retrieval Engine:
  - `searchKnowledge(query, filters)`: Fast cosine similarity search with destination and category filtering.
  - Timestamp auditing: Updates `retrieved_at` upon chunk retrieval.
- [x] Authoritative Knowledge Seed Dataset:
  - Official travel advisories and regulatory guidelines from Goa Tourism/Drishti Marine, Ministry of Home Affairs, State Transport Authorities, Archaeological Survey of India (ASI), Indian Mountaineering Foundation, and National Tourist Helpline (1363).
- [x] Prompt Injection Defense Layer:
  - Detects and flags instruction overrides, role spoofing, secret exfiltration, and embedded script payloads.
  - Sanitizes untrusted text and disarms malicious tokens.
  - Formats retrieved chunks inside strict, non-executable XML boundary containers (`<retrieved_knowledge_base>`) with machine directives.
- [x] Grounded RAG Q&A Flow (`askTravelAssistant`):
  - Formulates grounded prompts strictly bounded by retrieved authoritative chunks.
  - Generates verified, non-fabricated source citations (`title`, `source`, `destination`, `category`, `excerpt`, `similarity`).
  - Invariant: Zero fabricated citations. When no documents match, the system transparently reports lack of records.
- [x] Administration & Playground UI (`/admin/knowledge`):
  - Real-time search, destination and category filters.
  - Document ingestion form (Create / Edit / Delete).
  - Chunk and embedding metadata inspection modal.
  - One-click "Seed Authoritative Data" button.
  - Live interactive RAG Playground to test questions, inspect similarity, and audit citations.
- [x] REST API Endpoints:
  - `GET /api/admin/knowledge` & `POST /api/admin/knowledge`
  - `GET /api/admin/knowledge/[id]`, `PUT /api/admin/knowledge/[id]`, `DELETE /api/admin/knowledge/[id]`
  - `POST /api/admin/knowledge/seed`
  - `POST /api/rag/search`
  - `POST /api/rag/chat`
- [x] 14 unit & end-to-end tests in `test/phase10.test.ts` verifying cleaning, chunking, embeddings, cosine separation, retrieval, metadata filtering, prompt injection defense, non-fabrication of citations, and admin CRUD (126 tests total across all 10 phases).

---

## Phase 11: Real-Time Itinerary Replanning ("RE-PLAN MY DAY")
- [x] Deterministic Replan Engine (`src/lib/engines/replan-engine.ts`):
  - Recalculates remaining day itinerary without random full-itinerary destruction.
  - Automatically isolates completed past activities prior to current timestamp.
  - Time shift absorption: Recalculates travel times from current user GPS coordinates or last visited location.
  - Dynamic dwell compression: Safely reduces flexible visits (e.g., 120m/90m -> 75m/60m) to recover 30-60 minute delays while preserving landmark stops.
  - Operational hours enforcement: Removes stops if arrival falls past closing time; shortens dwell to finish before closing.
  - Weather conflict handling: Defers rain-conflicted outdoor activities (e.g. beaches, viewpoints) to later dry windows (e.g. 4 PM -> 6 PM) or introduces indoor cultural alternatives.
  - Low-priority item removal: Deterministically trims lowest priority activities (priority weight 4) when day schedule is exhausted, citing explicit human-readable reasons (`"Insufficient remaining time in daily schedule."`).
  - Discrete time invariant: Maintains separate `visit_minutes`, `travel_minutes`, `waiting_minutes`, and `buffer_minutes` across all items.
  - Exact budget delta calculation: Minor-unit accounting of cost additions or subtractions with zero floating-point drift.
- [x] Change Tracking & Explainability (`ReplanChange`):
  - Explicit change categories: `Added`, `Removed`, `Moved`, `Shortened`, `Extended`.
  - Detailed human-readable reasons (e.g. `"Moved to 18:00 for better weather window"`, `"Shortened from 120m to 75m to absorb 45-minute delay"`).
- [x] API Endpoint (`POST /api/trips/[id]/replan`):
  - Validates user authorization and inputs (`currentTime`, `delayMinutes`, `currentLocation`, `completedItemIds`, `apply`).
  - Supports dry-run preview or atomic persistence to database.
- [x] AI Travel Copilot Tool Integration:
  - Extended `replan_trip` tool schema with `delayMinutes`, `dayNumber`, and `currentTime`.
  - Copilot scenario matching: `"I'm 45 minutes late. Re-plan my day."` triggers deterministic replan engine and produces structured before/after diffs.
- [x] Interactive UI Modal (`src/components/travel/replan-modal.tsx`):
  - Delay preset quick-buttons (`+15m`, `+30m`, `+45m`, `+60m`).
  - GPS geolocation button (`Use My Current GPS Location`).
  - Visual summary cards showing delay, items preserved, items moved, items dropped, and budget difference.
  - Side-by-side Before vs. After schedule comparison with color-coded diff badges and reason callouts.
  - "Apply Replanned Schedule" button to save updates to the trip.
- [x] 11 unit, integration, and AI Copilot tests in `test/phase11.test.ts` (137 tests total passing across all phases).

---

## Phase 12: Collaborative Trips, Group Voting & Expense Splitting
- [x] Database Schema & Migrations (`supabase/migrations/20241007000000_collaboration_and_splitting.sql`):
  - `public.trip_members`: Roles (`owner`, `editor`, `viewer`) with RLS authorization.
  - `public.trip_invitations`: Secure email invitation tokens with 7-day expiration and accept/decline statuses.
  - `public.group_polls` & `public.group_votes`: Group decision polls (e.g. Beach, Trek, Museum) and member voting with live tallies.
  - `public.expenses`: Updated with `paid_by` and `split_type` (`equal`, `custom`, `percentage`).
  - `public.expense_participants`: Granular member share tracking in integer minor currency units.
- [x] Deterministic Settlement Engine (`src/lib/engines/settlement-engine.ts`):
  - Equal split: Integer minor unit distribution with deterministic remainder penny allocation ensuring $\sum \text{shares} \equiv \text{total}$.
  - Custom split: Validates exact allocation against total amount.
  - Percentage split: $100\%$ sum validation with rounding error reconciliation to the primary shareholder.
  - Minimal Cash Flow Debt Simplification: Solves multi-party debts with the theoretical minimum number of transactions (e.g., Hotel ₹6,000 paid by A split equally $\implies$ B owes A ₹2,000; C owes A ₹2,000).
- [x] Collaboration Services:
  - `CollaborationService` (`src/lib/services/collaboration-service.ts`): Membership management, role enforcement, and tokenized invitations.
  - `GroupPollService` (`src/lib/services/group-poll-service.ts`): Poll creation, member voting, vote switching, and winner determination.
  - `ExpenseSplittingService` (`src/lib/services/expense-splitting-service.ts`): Shared expense creation, participant tracking, and settlement calculation.
- [x] REST API Endpoints:
  - `GET /api/trips/[id]/members` & `POST /api/trips/[id]/members`
  - `PATCH /api/trips/[id]/members/[memberId]` & `DELETE /api/trips/[id]/members/[memberId]`
  - `POST /api/trips/invitations/[token]/accept`
  - `GET /api/trips/[id]/polls` & `POST /api/trips/[id]/polls`
  - `POST /api/trips/[id]/polls/[pollId]/vote`
  - `GET /api/trips/[id]/expenses/split` & `POST /api/trips/[id]/expenses/split`
  - `DELETE /api/trips/[id]/expenses/split/[expenseId]`
  - `GET /api/trips/[id]/expenses/settlement`
- [x] Interactive Frontend Pages:
  - `/trips/[tripId]/group`: Member roster, role indicators, invite modal, and group voting cards with live progress bars and winner badges.
  - `/trips/[tripId]/expenses`: Shared expense ledger, Equal/Custom/Percentage split modal, and visual "Who Owes Whom" debt settlement cards.
- [x] 15 comprehensive unit & integration tests in `test/phase12.test.ts` (152 tests total passing across all 12 phases).

---

## Phase 13: Production Polish & Performance Optimization
- [ ] Edge caching and Incremental Static Regeneration (ISR) for popular travel guides.
- [ ] End-to-end testing and lighthouse performance optimization.
- [ ] Vercel one-click deployment verification and continuous integration setup.
