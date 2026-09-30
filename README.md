# Rimjhim Roams — AI-Powered Travel OS

> Production-ready, Vercel-deployable travel operating system built using free-tier cloud primitives.

Rimjhim Roams synthesizes Gemini AI reasoning with geospatial PostGIS data, OpenStreetMap / OSRM routing, Open-Meteo meteorological forecasts, a deterministic non-LLM budget optimization engine, and a physical-feasibility Time Intelligence Engine to provide hyper-localized, realistic travel itineraries.

---

## 🚀 Tech Stack

| Layer | Service / Library | Tier |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) & React 18 | Free / Open Source |
| **Language** | TypeScript (Strict mode) | Open Source |
| **Styling** | Tailwind CSS & shadcn/ui components | Open Source |
| **Database** | Supabase (PostgreSQL + PostGIS + pgvector) | Free Tier (500MB) |
| **Authentication** | Supabase Auth + Session SSR Middleware | Free Tier |
| **Time Intelligence** | Custom Feasibility Engine (`TimeEngine`) | Open Source Logic |
| **Budget Engine** | Deterministic Integer Minor Units (`BudgetEngine`) | Non-LLM Custom Engine |
| **AI Engine** | Google Gemini 1.5 Flash via `@google/generative-ai` | Free Tier (Google AI Studio) |
| **Maps & Spatial** | PostGIS `geography(Point, 4326)`, Leaflet & OpenStreetMap | Free / Open Source |
| **Routing** | OSRM (Open Source Routing Machine) | Free Public API |
| **Weather** | Open-Meteo API | Free (No API key required) |
| **Deployment** | Vercel | Free Hobby Tier |

---

## 🧭 Application Routes

### Public & Discovery Routes
- `/`: Landing page highlighting architecture, feature cards, and the **Phase 7 "FIND WHERE I SHOULD GO" interactive destination discovery engine**.
- `/explore`: Searchable catalog of 8 core Indian destinations with climate filters and explicit DEMO badges.
- `/explore/destinations/[id]`: Destination travel guide featuring attractions, hotels, dining, transit, PostGIS radius search, and an interactive Leaflet route map.
- `/login`: Secure authentication portal with redirect preservation.
- `/register`: User onboarding and account creation.
- `/api/health`: Health monitoring and service availability status.
- `/assistant`: **Phase 9 Global AI Travel Copilot Console** featuring interactive tool execution displays, quick prompts, and deterministic grounded answers.
- `/trips/[id]/assistant`: **Phase 9 Trip-Specific AI Copilot** with hydrated itinerary context, budget inspection, schedule rebalancing, and "Apply Changes" actions.
- `/api/copilot/chat`: **Phase 9 AI Copilot Chat Endpoint** with session validation and multi-turn tool calling orchestration.
- `/api/destinations`: REST endpoint for destinations with search and climate filters.
- `/api/destinations/discover`: **Phase 7 Destination Discovery REST endpoint** (Origin + Budget + Duration + Profile + Preferences → Ranked feasible destinations).
- `/api/destinations/nearby`: PostGIS spatial radius query endpoint (`lat`, `lng`, `radius`).
- `/api/destinations/[id]/*`: Endpoints for attractions, hotels, restaurants, and transit options.
- `/api/geo/route`: Routing endpoint for on-demand waypoint route geometry, distance, and duration.

### Protected Itinerary, Budget & Time Routes (Secured by Next.js Middleware)
- `/dashboard`: Travel dashboard with upcoming & previous trips, quick stats, and empty states.
- `/trips`: Searchable and filterable itinerary directory with status badges.
- `/trips/new`: Itinerary planning form with duration calculation, budget & currency selectors, pace options, and automatic "destination discovery required" fallback.
- `/trips/[id]`: Individual itinerary inspection, configuration review, and deletion management.
- `/trips/[id]/assistant`: **Phase 9 AI Travel Copilot** attached to active trip data.
- `/trips/[id]/budget`: **Phase 4 Interactive Budget Dashboard** with category breakdowns, over-budget warnings, 4 optimization profiles, and live expense ledger.
- `/trips/[id]/itinerary`: **Phase 5 Time Intelligence Engine & Timeline Dashboard** with day selectors, discrete unmerged time blocks (visit, travel, queue, buffer), schedule feasibility validation, transit indicators, and **Optimize Day**.
- `/trips/[id]/weather`: **Phase 8 Weather Intelligence & Itinerary Shield Dashboard** with current conditions, multi-day forecast, hourly timeline, and automatic conflict detection & resolution (reschedules outdoor activities or swaps with indoor attractions).
- `/api/trips/[id]/budget`: REST endpoint for budget calculations and expense CRUD.
- `/api/trips/[id]/itinerary`: REST endpoint for itinerary days, items, and day optimization.
- `/api/trips/[id]/plan`: REST endpoint for generating and retrieving complete deterministic trip plans.
- `/api/trips/[id]/weather`: REST endpoint for live/cached forecasts and weather snapshots.
- `/api/trips/[id]/weather/integrate`: REST endpoint for weather-itinerary conflict resolution and updates.
- `/profile`: Multi-section personal traveler identity, contact details, emergency contacts, and AI preference tuning.

---

## 🤖 TripWise AI Travel Copilot (Phase 9)

- **Strict Architecture Invariant: Zero LLM Math**:
  `User → Gemini → Tool Selection → TripWise Backend Tool → Deterministic Service/Provider → Structured Result → Gemini → User Response`
  The LLM is strictly prohibited from computing budget math, route distances, or mutating the database directly. All authoritative actions pass through validated domain services.
- **12 Deterministic Backend Tools**:
  1. `search_destinations`: Keyword and climate search.
  2. `search_hotels`: Lodging candidate filtering by price ceiling and rating.
  3. `search_transport`: Flights, trains, buses, and local taxi tariffs.
  4. `search_restaurants`: Cuisine search under budget per person limits (e.g. ₹300).
  5. `search_attractions`: Sights with operational hours, fees, and weather suitability.
  6. `get_weather`: Live atmospheric conditions and multi-day meteorological forecasts.
  7. `calculate_route`: Real OSRM road geometry, distance, and transit time.
  8. `calculate_budget`: Zero-drift minor-unit financial aggregation across all 8 categories.
  9. `calculate_visit_duration`: Quick, Normal, Relaxed dwell times adjusted for pace.
  10. `optimize_itinerary`: Schedule rebalancing and validated attraction deletion.
  11. `replan_trip`: Deterministic budget optimization and stay adjustments.
  12. `get_trip_context`: Complete authorized trip hydration, items, budget, and weather.
- **Pluggable AI Provider**: `GeminiModelProvider` (Google Gemini 1.5 Flash via `@google/generative-ai`) with automatic fallback to `DeterministicCopilotProvider` for offline test suites and zero-key deployments.
- **Strict Authorization Boundaries**: Current authenticated user context is strictly isolated; users cannot inspect or replan other users' trips.
- **Interactive Copilot UI**:
  - Global `/assistant` and contextual `/trips/[id]/assistant`.
  - Tool execution badges showing latency in milliseconds (`14ms`) and success/error status.
  - Expandable JSON inspector to audit exact inputs and structured tool results.
  - Contextual action buttons (e.g. *"Apply Changes & View Itinerary"*).

---

## 🧭 Connected Complete Trip Planner (Phase 6)

- **TripPlannerService Pipeline**: Connects catalog destinations, hotels, attractions, dining, transit, routing, time intelligence, and budget engine into a single deterministic 10-stage execution pipeline.
- **Deterministic End-to-End Orchestration**:
  1. Resolves destination from catalog or spatial proximity.
  2. Selects suitable hotels matching party size, nights, and target lodging budget.
  3. Curation of attractions with duration tiers (`Quick`, `Normal`, `Relaxed`), queue waiting, and opening hours checks.
  4. Curates lunch and dinner dining matching dietary preferences.
  5. Selects intercity round-trip transit and local mobility mode.
  6. Calculates geospatial routes on OpenStreetMap and transit duration.
  7. Assembles day schedules with strictly discrete `visit_time`, `travel_time`, `waiting_time`, and `buffer_time`.
  8. Calculates minor-unit accurate budget across all 8 required categories.
  9. Deterministic optimization when budget is exceeded (cheaper lodging, transit, and authentic bistro dining alternatives).
  10. Persists structured plan into database and cache.
- **Interactive Progress & Views**:
  - Live animated 6-stage tracker: *Finding places → Finding hotel → Calculating transport → Optimizing route → Calculating budget → Building itinerary*.
  - Comprehensive 8-part UI: Overview hero, interactive Leaflet map canvas, day schedule timeline with discrete blocks, budget progress bar with 8 category cards, hotel details, transit passes, dining schedule, and attractions catalog.

---

## ⏱️ Time Intelligence Engine (Phase 5)

- **Discrete, Unmerged Time Allocation**: Every itinerary item strictly separates `visit_time`, `travel_time`, `waiting_time`, and `buffer_time` to prevent schedule collapse.
- **Feasibility Rules**:
  - `attraction_closed`: Detects visits scheduled outside opening and closing hours.
  - `insufficient_time`: Detects visits shorter than the required minimum threshold.
  - `overlapping_activities`: Detects chronological collisions between consecutive activities.
  - `impossible_travel`: Detects gaps smaller than the required transit time between locations.
  - `excessive_daily_schedule`: Warns on waking hour exhaustion or extended active spans without meals/rest.
- **Duration Tiers**: Supports `Quick`, `Normal`, and `Relaxed` durations adjusted by travel pace, traveller type, weather, and sunset viewpoints.
- **Optimize Day**: Automatically resolves opening hour conflicts, reorders sights by geographic proximity, inserts meal/rest blocks, and eliminates impossible transit conditions.

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on v20.14.0)
- **npm** v10+

### 2. Installation
```bash
git clone https://github.com/sourabhsk0001/Rimjhim-Roams.git
cd "Rimjhim Roams"
npm install
```

### 3. Environment Setup
Copy the `.env.example` file to create `.env.local`:
```bash
cp .env.example .env.local
```
Add your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `GEMINI_API_KEY`: Google AI Studio API key

### 4. Database Setup
Execute the migrations in order in your Supabase SQL Editor:
1. [`supabase/migrations/20241001000000_initial_schema.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241001000000_initial_schema.sql): Sets up user profiles, travel preferences, trips, trip members, RLS policies, and triggers.
2. [`supabase/migrations/20241002000000_core_travel_data.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241002000000_core_travel_data.sql): Sets up destinations, attractions, hotels, restaurants, transport, taxis, reviews, spatial indexes, and the `find_nearby_attractions` PostGIS function.
3. [`supabase/migrations/20241003000000_budget_and_expenses.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241003000000_budget_and_expenses.sql): Sets up `price_snapshots` and `expenses` tables with RLS policies and indexes.
4. [`supabase/migrations/20241004000000_time_and_itineraries.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241004000000_time_and_itineraries.sql): Sets up `itineraries`, `itinerary_items`, and `route_segments` tables with RLS policies.
5. [`supabase/migrations/20241005000000_weather_snapshots.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241005000000_weather_snapshots.sql): Sets up `weather_snapshots` table with RLS policies and indexes.

### 5. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Validation & Quality Checks
```bash
# Run full automated test suite (91 tests across all 8 phases)
npm test

# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Run optimized production build
npm run build
```

---

## 🏛️ Documentation
- [System Architecture](file:///C:/Rimjhim%20Roams/docs/architecture.md)
- [Database & Schema Architecture](file:///C:/Rimjhim%20Roams/docs/database.md)
- [Phased Project Roadmap](file:///C:/Rimjhim%20Roams/docs/roadmap.md)

---

## 📄 License
MIT
