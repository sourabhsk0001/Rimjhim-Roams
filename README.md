# Rimjhim Roams — AI-Powered Travel OS

> Production-ready, Vercel-deployable travel operating system built using free-tier cloud primitives.

Rimjhim Roams synthesizes Gemini AI reasoning with geospatial PostGIS data, OpenStreetMap / OSRM routing, Open-Meteo meteorological forecasts, and a deterministic non-LLM budget optimization engine to provide hyper-localized, cost-optimized travel itineraries.

---

## 🚀 Tech Stack

| Layer | Service / Library | Tier |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) & React 18 | Free / Open Source |
| **Language** | TypeScript (Strict mode) | Open Source |
| **Styling** | Tailwind CSS & shadcn/ui components | Open Source |
| **Database** | Supabase (PostgreSQL + PostGIS + pgvector) | Free Tier (500MB) |
| **Authentication** | Supabase Auth + Session SSR Middleware | Free Tier |
| **Budget Engine** | Deterministic Integer Minor Units (`BudgetEngine`) | Non-LLM Custom Engine |
| **AI Engine** | Google Gemini 1.5 Flash via `@google/generative-ai` | Free Tier (Google AI Studio) |
| **Maps & Spatial** | PostGIS `geography(Point, 4326)`, Leaflet & OpenStreetMap | Free / Open Source |
| **Routing** | OSRM (Open Source Routing Machine) | Free Public API |
| **Weather** | Open-Meteo API | Free (No API key required) |
| **Deployment** | Vercel | Free Hobby Tier |

---

## 🧭 Application Routes

### Public & Discovery Routes
- `/`: Landing page highlighting architecture, feature cards, and demo plans.
- `/explore`: Searchable catalog of 8 core Indian destinations with climate filters and explicit DEMO badges.
- `/explore/destinations/[id]`: Destination travel guide featuring attractions, hotels, dining, transit, PostGIS radius search, and an interactive Leaflet route map.
- `/login`: Secure authentication portal with redirect preservation.
- `/register`: User onboarding and account creation.
- `/api/health`: Health monitoring and service availability status.
- `/api/destinations`: REST endpoint for destinations with search and climate filters.
- `/api/destinations/nearby`: PostGIS spatial radius query endpoint (`lat`, `lng`, `radius`).
- `/api/destinations/[id]/*`: Endpoints for attractions, hotels, restaurants, and transit options.
- `/api/geo/route`: Routing endpoint for on-demand waypoint route geometry, distance, and duration.

### Protected Itinerary & Budget Routes (Secured by Next.js Middleware)
- `/dashboard`: Travel dashboard with upcoming & previous trips, quick stats, and empty states.
- `/trips`: Searchable and filterable itinerary directory with status badges.
- `/trips/new`: Itinerary planning form with duration calculation, budget & currency selectors, pace options, and automatic "destination discovery required" fallback.
- `/trips/[id]`: Individual itinerary inspection, configuration review, and deletion management.
- `/trips/[id]/budget`: **Phase 4 Interactive Budget & Optimization Dashboard** with category breakdowns, over-budget warnings, 4 optimization profiles, deterministic alternatives with live Accept/Reject trade-offs, and an expense ledger.
- `/api/trips/[id]/budget`: REST endpoint for budget calculations, optimization profiles, and expense CRUD.
- `/profile`: Multi-section personal traveler identity, contact details, emergency contacts, and AI preference tuning.

---

## 💰 Deterministic Budget & Optimization Engine (Phase 4)

- **Strict Non-LLM Determinism**: All monetary values, cost breakdowns, and over-budget differences are computed deterministically with zero LLM hallucination risk.
- **Integer Minor Units Precision**: Calculations run in integer minor units (1 INR = 100 paise) preventing IEEE-754 floating-point errors (`0.1 + 0.2 = 0.3`).
- **All 8 Standard Categories Supported**: `transport`, `hotel`, `food`, `local_transport`, `activities`, `shopping`, `emergency_buffer`, `other`.
- **4 Optimization Profiles**:
  1. `Budget Saver`: Aggressively trims costs via verified budget stays, train/bus alternatives, and free scenic/cultural spots.
  2. `Time Saver`: Minimizes commute overhead via route clustering and rapid transit.
  3. `Experience Maximizer`: Protects premier culinary and bucket-list activities.
  4. `Balanced`: Pragmatic midpoint balancing cost, speed, and leisure.
- **Rule-Based Alternatives with Trade-Offs**:
  - Cheaper hotel, cheaper transport, different transport mode, cheaper dining, remove low-priority activity, replace activity, optimize local route.
  - Interactive **Accept** / **Reject** buttons that dynamically adjust category costs, recalculate totals, and eliminate deficits in real time.
- **Expense Tracking Ledger**: Travelers can log actual on-the-ground expenditures by category, tracking live expenses against the allocated cap.

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

### 5. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Validation & Quality Checks
```bash
# Run full automated test suite (50 tests: auth, trip CRUD, spatial search, catalog, routing, budget engine)
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
