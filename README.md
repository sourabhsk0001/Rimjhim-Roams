# Rimjhim Roams — AI-Powered Travel OS

> Production-ready, Vercel-deployable travel operating system built using free-tier cloud primitives.

Rimjhim Roams synthesizes Gemini AI reasoning with geospatial PostGIS data, OpenStreetMap / OSRM routing, and Open-Meteo meteorological forecasts to provide hyper-localized, optimized travel itineraries.

---

## 🚀 Tech Stack

| Layer | Service / Library | Tier |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) & React 18 | Free / Open Source |
| **Language** | TypeScript (Strict mode) | Open Source |
| **Styling** | Tailwind CSS & shadcn/ui components | Open Source |
| **Database** | Supabase (PostgreSQL + PostGIS + pgvector) | Free Tier (500MB) |
| **Authentication** | Supabase Auth + Session SSR Middleware | Free Tier |
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

### Protected Itinerary Routes (Secured by Next.js Middleware)
- `/dashboard`: Travel dashboard with upcoming & previous trips, quick stats, and empty states.
- `/trips`: Searchable and filterable itinerary directory with status badges.
- `/trips/new`: Itinerary planning form with duration calculation, budget & currency selectors, pace options, and automatic "destination discovery required" fallback.
- `/trips/[id]`: Individual itinerary inspection, configuration review, and deletion management.
- `/profile`: Multi-section personal traveler identity, contact details, emergency contacts, and AI preference tuning.

---

## 🗺️ Geospatial & Routing Features (Phase 3)

- **Interactive Leaflet Canvas**: Zero-SSR crash implementation utilizing dynamic imports with custom semantic SVG pins (Destination, Attractions, Accommodations, Dining).
- **Multi-Mode Routing**: Support for `driving`, `walking`, and `cycling` with realistic speed and travel time estimates.
- **RoutingProvider Abstraction**: Decoupled interface with `calculateRoute()`, `calculateDistance()`, and `calculateTravelTime()`.
- **Resilient Fallback**: Automatic failover to Haversine great-circle calculation with mode-adjusted speeds on network timeout or OSRM unavailability.
- **PostGIS Integration**: Stored geographic coordinates (`geography(Point, 4326)`) and GIST-indexed spatial queries for radius discovery.

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

### 5. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Validation & Quality Checks
```bash
# Run full automated test suite (32 tests: auth, trip CRUD, spatial search, catalog, routing)
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
