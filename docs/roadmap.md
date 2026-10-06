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

## Phase 13: Source-Backed Safety Center & Emergency Mode
- [x] Database Schema & Migration (`supabase/migrations/20241008000000_safety_center.sql`):
  - `public.safety_facilities`: Stores hospitals, trauma centers, and police stations with coordinates, direct phones, categories, and verified sources.
  - `public.safety_advisories`: Stores official advisories, transport disruptions, and statutory local rules with citations and penalties.
  - Public read RLS for open civic safety data with authenticated administration policies.
- [x] Strict Safety Invariants:
  - **No arbitrary safety scores**: Zero synthetic numeric or letter ratings.
  - **No fabricated alerts**: Real meteorological and transport notices only; defaults to verified "No active alerts reported".
  - **No false emergency dispatch claims**: Direct one-tap citizen dialing to 112/108/100/1363 and structured SOS sharing; no fake server dispatch claims.
  - **Explicit user geolocation permission**: Location is never requested automatically on mount; triggered exclusively on explicit user button click.
  - **Metadata integrity**: Every record includes `source` and `retrieved_at` timestamp.
- [x] Services & Engines (`src/lib/services/safety-service.ts`):
  - `SafetyService`: Curation of verified national emergency helplines (ERSS 112, EMRI 108, Police 100, Fire 101, Tourist Helpline 1363, Women Helpline 1091) and destination registries for all 8 core destinations.
  - Haversine proximity engine (`calculateHaversineKm`): Computes distances from user live coordinates to medical/police facilities and sorts nearest first.
  - Trip Emergency Card generation: Combines hotel reservations, traveler count, helplines, nearest trauma center, nearest police post, and live Google Maps GPS pin into a shareable SOS text block.
  - Graceful fallback for unlisted destinations: Provides nationwide ERSS 112 helplines, standard ASI monument preservation rules, and verified notice that local hospital records are unverified.
- [x] REST API Endpoints:
  - `GET /api/trips/[id]/safety`: Authorized member access with optional `latitude` and `longitude` query params for proximity sorting and SOS card hydration.
  - `GET /api/safety/destinations/[destination]`: Public lookup for destination safety directories and local rules.
- [x] AI Travel Copilot Integration (`src/lib/ai/tools/registry.ts`):
  - `get_safety_info` tool definition and dispatcher for querying emergency numbers, 24/7 hospitals, local statutory rules, and personalized trip SOS cards.
- [x] Frontend Safety Center & Emergency Mode (`src/app/trips/[id]/safety/page.tsx`):
  - Emergency SOS view with high-contrast alert design, one-tap calling buttons (`112`, `108`, `100`, `1363`, `1091`).
  - Nearest 24/7 hospital and police cards with direct phone dialers and Google Maps directions.
  - Explicit GPS permission button with accuracy feedback and live coordinates mapping.
  - One-tap "Copy SOS Info" and Web Share API integration for instant WhatsApp / SMS sharing.
  - Tabbed directories: Helplines, Hospitals, Police, Weather Alerts, Travel Advisories, Transport Disruptions, and Local Rules (with statutory citations and penalties).
  - Navigation link added to trip details header (`/trips/[id]/safety`).
- [x] 12 comprehensive unit and integration tests in `test/phase13.test.ts` (164 tests total passing across all 13 phases).

---

## Phase 14: Travel Management Layer (Packing, Private Documents & Bookings) (Completed)
- [x] Database Schema & Migrations (`supabase/migrations/20241009000000_travel_management.sql`):
  - `public.trip_packing_items`: Checklist storage with category checks, quantity, checked state, custom items, and RLS.
  - `public.trip_documents`: Private storage metadata tracking with file path, MIME types, and RLS.
  - `public.trip_bookings`: Bookings table with provider, reference, types, status checks, and RLS.
  - Storage bucket registration: Private bucket `travel-documents` (20MB limit, allowed MIME types).
- [x] Domain Models (`src/types/travel-management.ts`):
  - Complete types for `PackingCategory`, `PackingItem`, `GeneratePackingInput`, `PackingListSummary`, `TravelDocumentType`, `TripDocument`, `UploadDocumentInput`, `BookingType`, `BookingStatus`, `TripBooking`, `CreateBookingInput`, `BookingsSummary`.
- [x] Deterministic Packing Engine (`src/lib/engines/packing-engine.ts`):
  - Adapts to destination, duration, weather (cold/alpine, rainy/monsoon, warm/tropical), activities (beach, trekking, temples/heritage, nightlife, business), and traveller type (solo, couple, family, friends, business).
  - 6 required categories: `Clothing`, `Documents`, `Toiletries`, `Electronics`, `Weather`, `Activity-specific`.
  - Checkboxes, category toggles, custom items, and progress summary.
- [x] Private Storage & Secure Documents (`src/lib/services/document-service.ts`):
  - Supabase Storage integration with private storage bucket (`travel-documents`).
  - Strict expiring signed URLs (1 hour expiration) preventing exposure of raw storage URLs.
  - 4 document types: `tickets`, `hotel confirmations`, `activity confirmations`, `other travel documents`.
  - Strict access control: members can view/download; editors/owners can upload/delete; intruders are blocked.
- [x] Booking Records & Invariant Enforcement (`src/lib/services/booking-service.ts`):
  - 7 booking types: `flight`, `train`, `bus`, `hotel`, `taxi`, `activity`, `restaurant`.
  - Invariant: *Do not claim confirmation without actual provider confirmation*. Status requires valid provider booking reference to be `confirmed`; otherwise downgraded to `pending_confirmation`.
  - Currency minor units precision, status lifecycle, and spent/pending aggregates.
- [x] REST API Endpoints:
  - `GET`, `PATCH`, `POST`, `DELETE /api/trips/[id]/packing`
  - `POST /api/trips/[id]/packing/regenerate`
  - `GET`, `POST /api/trips/[id]/documents`
  - `DELETE /api/trips/[id]/documents/[docId]`
  - `GET`, `POST /api/trips/[id]/bookings`
  - `PATCH`, `DELETE /api/trips/[id]/bookings/[bookingId]`
- [x] Interactive Frontend Pages:
  - `/trips/[tripId]/packing`: Dynamic packing list with progress counter, category filters, custom item additions, and one-tap re-generation.
  - `/trips/[tripId]/documents`: Secure documents vault with private storage badge, category filters, signed URL download buttons, and upload modal.
  - `/trips/[tripId]/bookings`: Bookings management dashboard with spend and confirmation stats, provider verification callouts, and booking creation modal.
  - Updated Trip Detail page (`/trips/[id]`) with navigation actions for Packing, Documents, and Bookings.
- [x] 14 comprehensive unit and integration tests in `test/phase14.test.ts` (178 tests total passing across all 14 phases).

---

## Phase 15: Useful Non-Sensitive Travel Memories & Preference Intelligence (Completed)
- [x] Database Schema & Migrations (`supabase/migrations/20241010000000_travel_memories.sql`):
  - `public.travel_memories`: Table with `type` ('like', 'avoid'), `category` ('destination', 'hotel', 'restaurant', 'transit', 'itinerary', 'general'), `keyword`, `notes`, `is_active`, and RLS.
  - Strict user-level RLS policies: Users can SELECT, INSERT, UPDATE, and DELETE only their own memories (`auth.uid() = user_id`).
- [x] Domain Models (`src/types/memories.ts`):
  - `MemoryType`, `MemoryCategory`, `TravelMemory`, `CreateMemoryInput`, `UpdateMemoryInput`, `UserTravelMemoriesSummary`, `MemoriesResponse`.
- [x] Security & Sensitive Information Guardrail (`src/lib/services/travel-memory-service.ts`):
  - Strict pattern matching blocking credit cards, passwords, secrets, API tokens, Aadhaar, PAN, SSN, and medical diagnosis records.
  - Dedicated exception informing users that TripWise only records non-sensitive travel preferences.
- [x] Service Layer (`src/lib/services/travel-memory-service.ts`):
  - Full CRUD operations: `getMemories`, `getMemoryById`, `createMemory`, `updateMemory`, `deleteMemory`.
  - Categorized summary extraction: `getUserMemoriesSummary`.
- [x] 5 Core System Integrations:
  1. **Destination Discovery**: Boosts match scores (+15 pts) for destinations matching saved likes (e.g. Nature); prioritizes rail travel for users with train preferences.
  2. **Hotel Selection**: Honors budget hotel preferences and actively avoids luxury/resort markups.
  3. **Restaurant Selection**: Prioritizes authentic regional cuisines (e.g. Goan seafood, Rajasthani thali) when user likes local food.
  4. **Itinerary Planning**: Automatically forces relaxed pace (max 2 attractions/day) and relaxed duration tier when user avoids overpacked itineraries.
  5. **AI Travel Copilot Context**: Injects authorized travel memories into `get_trip_context` and dedicated `get_travel_memories` tool with strict user isolation.
- [x] REST API Endpoints:
  - `GET /api/memories` & `POST /api/memories`
  - `GET /api/memories/[id]`, `PATCH /api/memories/[id]`, `DELETE /api/memories/[id]`
- [x] Frontend Experiences:
  - Dedicated `/memories` page with Likes (emerald) and Avoids (rose) columns, category filters, quick-add suggestion chips, Add/Edit modal, and instant deletion.
  - Added "Memories" navigation item with Heart icon in `src/components/navigation.tsx`.
  - Added "Your Travel Likes & Avoids" card with direct management link in `/profile`.
- [x] 11 comprehensive unit & integration tests in `test/phase15.test.ts` (189 tests total passing across all 15 phases).

---

## Weather-Based Trip Planning & Open-Meteo Integration (Completed)
- [x] **Open-Meteo Climatology & Forecast Integration (`src/lib/weather/provider.ts`)**:
  - Leverages Open-Meteo API for real-time weather, 7–16 day numerical weather prediction (NWP), and climatological averages without requiring API keys.
  - Connected to Open-Meteo Air Quality API (`air-quality-api.open-meteo.com`) capturing US AQI (0–500), European AQI (0–100), fine PM2.5, and coarse PM10 with category classifications and health advisories.
- [x] **Activity Weather Suitability Matrix (`src/types/weather.ts`, `src/lib/weather/provider.ts`)**:
  - Automated activity readiness evaluation across 5 travel categories: Sightseeing & City Walks, Beaches & Water Sports, Treks & Hill Trails, Museums & Cultural Sites, and Golden Hour Photography.
  - Scores (0–100%), status ratings (`Optimal`, `Suitable`, `Fair`, `Challenging`, `Not Recommended`), badge styling, and actionable travel tips based on temperature, rain probability, wind speed, visibility, and AQI.
- [x] **Weather-Adapted Trip Planner Pipeline (`src/lib/services/trip-planner-service.ts`)**:
  - Stage 6 & 7 integrates Open-Meteo forecasts during generation.
  - Automatically identifies precipitation risk (>40% rain) and dynamically prioritizes indoor attractions (museums, palaces, temples) during rainy periods.
  - Attaches `weather: DailyWeather` to each `PlannedDayItinerary` and `weatherForecast` to the root `PlannedTripResult`.
- [x] **Public Destination Weather API (`src/app/api/destinations/[id]/weather/route.ts`)**:
  - REST endpoint delivering live Open-Meteo forecast, air quality metrics, and activity suitability matrix for any catalog destination with rate limiting and input sanitization.
- [x] **Trip Workspace Weather Card (`src/app/trips/[id]/page.tsx`)**:
  - Added real-time atmospheric metrics card: temperature, feels-like, US AQI badge, PM2.5 particulate count, humidity, wind, and advisory banner.
  - Interactive 7-day schedule forecast strip with click-to-jump day selection and condition icons.
  - Attached day-specific weather badges to the itinerary day headers.
- [x] **Destination Catalog Weather Tab (`src/app/explore/destinations/[id]/page.tsx`)**:
  - Hero banner live weather & AQI badge display.
  - Dedicated "Weather & Climatology" tab featuring current conditions, air quality particulate breakdown, 7-day forecast cards, and activity suitability matrix.
- [x] **Dedicated Weather Center (`src/app/trips/[id]/weather/page.tsx`)**:
  - Enhanced with real-time Air Quality & Environmental Telemetry (US AQI, European AQI, PM2.5, PM10).
  - Activity Weather Suitability Matrix with visual progress bars.
  - Existing Itinerary Weather Shield conflict detection and one-tap auto-rescheduling.
- [x] **Comprehensive Testing (`test/weather_openmeteo.test.ts`)**:
  - 5 dedicated unit and integration tests verifying AQI categorization, suitability scoring, advisory generation, and trip planner weather integration (266 automated tests passing).

---

## Phase 16: Production Polish, PWA Offline Support & Monitoring
- [ ] Offline caching for emergency cards and destination safety data via Service Workers.
- [ ] Multi-region CDN asset delivery and static optimization.
- [ ] Continuous integration automated deployment pipeline.



