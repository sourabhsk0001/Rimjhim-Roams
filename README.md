# Rimjhim Roams — Autonomous AI Travel Operating System

<div align="center">
  <p><strong>Your Entire Journey, Planned by AI.</strong></p>
  <p><em>Production-grade, Vercel-deployable autonomous travel operating system built with Next.js 14, Supabase, Google Gemini AI, PostGIS spatial intelligence, and deterministic computational engines.</em></p>

  [![Version](https://img.shields.io/badge/version-0.5-blue.svg)](package.json)
  [![License](https://img.shields.io/badge/License-Apache_2.0-orange.svg)](LICENSE)
  [![Build & Deploy](https://img.shields.io/badge/Vercel-Deployable_Zero--Config-black?logo=vercel)](https://vercel.com)
  [![Tests](https://img.shields.io/badge/Tests-291_Passed_100%25-brightgreen)](https://github.com/sourabhsk0001/Rimjhim-Roams)
  [![Next.js](https://img.shields.io/badge/Next.js-14.2.18_App_Router-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Database-Supabase_%2B_Local_Persistent_DB-3ECF8E?logo=supabase)](https://supabase.com)
  [![Gemini](https://img.shields.io/badge/AI-Google_Gemini_1.5_Flash-4285F4?logo=google)](https://ai.google.dev/)
</div>

---

## 🌟 Executive Summary

**Rimjhim Roams** (TripWise AI OS) eliminates disjointed travel planning by uniting destination discovery, lodging curation, transit routing, meteorological forecasting, time budgeting, and real-time expense reconciliation into a single cohesive platform.

Built around a **Zero LLM Math** architectural invariant, AI models are strictly prohibited from performing budget arithmetic or inventing route coordinates. Instead, Google Gemini AI functions as an intelligent orchestrator executing deterministic backend services (OSRM road networks, Open-Meteo forecasts, PostGIS spatial queries, and integer-minor-unit financial engines).

---

## 🚀 Key Capabilities

### 1. 🎬 Cinematic Video Landing Experience
- **Full-Screen Responsive Video Hero**: Plays `/videos/landing-page.mp4` with calibrated scrims, hardware-accelerated loops, and high-fidelity fallback poster posters.
- **Glassmorphic Brand Navigation**: Responsive brand header featuring route badges, mobile drawer navigation, and instant session feedback.
- **Interactive Trip Planning Panel**: Configure starting location, destination, calendar dates, travel party size, target budget tier, travel pace, and experience style in a single control deck.
- **Dynamic Travel Modes**: Preset modes for *Solo*, *Couple*, *Friends*, *Family*, *Budget*, *Luxury*, *Adventure*, and *Relaxed* journeys.

### 2. 🗺️ NATMO & GeoNames GIS Explorer (`/explore`)
- **Official 36 States & UTs Catalog**: Complete GeoNames dataset covering all Indian states, capitals, climate zones, and official Ministry of Tourism (MoT) themes.
- **NATMO Thematic Circuits**: Authentic thematic circuits (Golden Triangle, Buddhist Circuit, Desert Triangle, Malabar Coast, Himalayan Footsteps, and North-East Explorer).
- **Fast Debounced Autocomplete**: Multi-entity instant search querying administrative states, districts, circuits, and heritage monuments simultaneously.
- **Spatial Radius Discovery**: PostGIS `geography(Point, 4326)` geospatial radius querying (`/api/destinations/nearby`) with Leaflet interactive route geometry.

### 3. 🤖 TripWise AI Travel Copilot (`/assistant` & `/trips/[id]/assistant`)
- **Deterministic 12-Tool Registry**:
  1. `search_destinations`: Real-time catalog & climate discovery.
  2. `search_hotels`: Filter lodging candidates by price ceilings and star ratings.
  3. `search_transport`: Intercity rail, flights, state buses, and taxi tariffs.
  4. `search_restaurants`: Curate dining matching dietary preferences under strict cost caps.
  5. `search_attractions`: Verified opening hours, entry tickets, and weather suitability.
  6. `get_weather`: Live atmospheric telemetry and 7-day meteorological forecasts.
  7. `calculate_route`: Real OSRM highway coordinates, transit distance, and duration.
  8. `calculate_budget`: Zero-drift minor-unit financial aggregation across 8 expense categories.
  9. `calculate_visit_duration`: Pace-adjusted dwell times (`Quick`, `Normal`, `Relaxed`).
  10. `optimize_itinerary`: Geographic TSP resequencing and schedule rebalancing.
  11. `replan_trip`: Deterministic budget optimization and stay restructuring.
  12. `get_trip_context`: Complete authorized trip hydration with RLS isolation.
- **Zero-Key Deterministic Fallback**: Automatic offline provider for unit tests and zero-env deployments.

### 4. 📚 Authoritative Travel RAG Knowledge Base (`/admin/knowledge`)
- **Pure PostgreSQL + pgvector**: Vector search (`vector(768)`) using IVFFlat cosine similarity without external vendor dependencies.
- **Sliding Window Chunking**: Token-safe ~500-character chunking with 80-character boundary overlap and whitespace sanitization.
- **Prompt Injection Defense**: Defense-in-depth regex filter neutralizing instruction hijacking (`ignore previous instructions`, `[SYSTEM]`, script tags) and bounding retrieved records in non-executable XML delimiters (`<retrieved_knowledge_base>`).
- **Verified Source Citations**: Guaranteed hallucination-free responses citing only matched database records.

### 5. ⏱️ Physical-Feasibility Time Intelligence Engine
- **Discrete Activity Separation**: Itinerary items strictly segregate `visit_time`, `travel_time`, `waiting_time`, and `buffer_time` to prevent temporal schedule collapse.
- **Feasibility Verification Rules**: Flags closed sights, sub-threshold visits, chronological collisions, impossible transit gaps, and traveller exhaustion.
- **Optimize Day**: Automatically aligns sightseeing with official operating hours and inserts appropriate dining/rest pauses.

### 6. 🛡️ Dual-Layer Authentication & Database
- **Live Supabase Auth + Persistent Local DB**: Seamlessly connects to live Supabase PostgreSQL when credentials exist, while providing an integrated, local persistent database (`src/lib/db/app-db.ts` -> `data/app-db.json`) for offline development and zero-config Vercel deployments.
- **Instant Demo Accounts**: One-click demo credentials for travelers (`demo@tripwise.ai` / `password123`) and administrators (`admin@tripwise.ai` / `admin123`).
- **Unified Session Resolver**: Centralized [`src/lib/auth/session.ts`](file:///c:/Rimjhim%20Roams/src/lib/auth/session.ts) validating both live Supabase JWTs and application session cookies across all 20+ API endpoints.

### 7. 🌐 Public Profiles & Community Explorer Directory (`/api/public-profiles`)
- **Strict RLS & Privacy Separation**: Public profiles decouple community explorer cards from sensitive user identities (`profiles`, `traveller_profiles`). Private PII (email, phone, emergency contacts, budget) is strictly guarded behind `auth.uid() = user_id`.
- **Clean-Format Invariants**: Enforces strict database `CHECK` constraints and TypeScript validators (lowercased alphanumeric username slugs, no XSS/HTML angle brackets, valid travel styles, 0–36 visited states).
- **Pre-Configured Explorer Personas**: 5 diverse authentic Indian explorer cards pre-seeded in SQL and local DB (`priya_travels`, `kabir_peaks`, `ananya_coastal`, `vikram_royal`, `zoya_slowroad`).
- **Public Discovery & Filter API**: Instant search across usernames, bios, and home cities with travel style filtering.

### 8. 🔒 Two-Tier Edge Authorization & Sliding-Window Rate Limiting
- **Edge Middleware Gate (Tier 1)**: Intercepts unauthenticated callers to protected `/api/*` endpoints before serverless execution, returning `401 Unauthorized`. Sliding-window token tracking returning `429 Too Many Requests` with `Retry-After`.
- **Route Handler RBAC & Resource Defense (Tier 2)**: Strict `requireAuth(req)` and `requireAdmin(req)` guards enforcing role-based access (`role === 'admin'`) with `403 Forbidden` on admin endpoints, and user resource isolation.
- **Granular Rate-Limit Tiers**: 15 req/min on auth, 30 req/min on AI/heavy routes, 60 req/min on general routes. Public discovery routes remain readable without credentials while protected against denial of service.

### 9. ⚡ Gemini Daily API Quota & Free-Tier Fair Usage (`/api/ai/quota`)
- **Server-Wide Safety Ceiling**: Configurable ceiling (`GEMINI_DAILY_SERVER_LIMIT=1000`, default 1,000 req/day) guarding against exceeding Google Gemini's 1,500 daily requests free-tier limit.
- **Per-User Fair Usage Cap**: 20 req/day (`GEMINI_DAILY_USER_LIMIT=20`) per authenticated account ensuring equitable access for all student evaluators, recruiters, and travelers.
- **Transparent Student-Project Reasoning**: Returns descriptive HTTP 429 errors explaining the academic student project constraints, exact midnight UTC reset countdowns, and instant reminders that deterministic tools (OSRM routing, Open-Meteo forecasts, NATMO exploration, budget math) remain 100% available without limits.
- **Live Status & Visual Indicators**: Dedicated `/api/ai/quota` inspection endpoint and dynamic header pill indicators in the AI Travel Copilot.

### 10. 🌦️ Weather-Based Trip Planning & Open-Meteo Integration (`/trips/[id]/weather`)
- **Open-Meteo NWP & Air Quality Telemetry**: Real-time atmospheric metrics (temperature, feels-like, humidity, wind speed, UV index) and real-time Air Quality (US AQI 0–500, European AQI 0–100, PM2.5, PM10) with tailored health advisories without API keys.
- **Activity Weather Suitability Matrix**: Automated readiness scoring across 5 travel categories: *Sightseeing & City Walks*, *Beaches & Water Sports*, *Treks & Hill Trails*, *Museums & Cultural Sites*, and *Golden Hour Photography*, complete with status badges (`Optimal`, `Suitable`, `Fair`, `Challenging`, `Not Recommended`) and practical advice.
- **Weather-Adapted Trip Planner**: Automatically detects precipitation risk (>40% rain) and dynamically prioritizes indoor attractions (museums, palaces, temples) during rainy periods, attaching daily weather directly to itinerary days.
- **Integrated Workspace & Destination Views**: Live weather intelligence card on `/trips/[id]`, interactive 7-day schedule forecast strip, itinerary day weather pills, dedicated "Weather & Climatology" tab on `/explore/destinations/[id]`, and public API endpoint `/api/destinations/[id]/weather`.

### 11. 🗺️ GPU-Accelerated MapLibre GL JS & 3D Spatial Navigation
- **3D Terrain & GPU Acceleration**: WebGL-powered 3D perspective tilt (58° pitch, camera bearing rotation, terrain relief shading) rendering OpenStreetMap vector and raster cartography without proprietary map token limits.
- **Comprehensive Transit & POI Layers**:
  - 🏨 **Hotels**: Amber luxury stay markers with nightly rates, star ratings (★ 4.8/5.0), reviews count, and booked stay highlights.
  - 📍 **Tourist Attractions**: Numbered waypoint pins (`#1`, `#2`, `#3`, ...) strictly synchronized with the traveler's day schedule, ticket pricing, and visiting hours.
  - 🍽️ **Dining**: Rose culinary markers featuring regional cuisine tags, price tiers, and schedule meal associations.
  - 🚕 **Taxi Pickup & Auto Stands**: Regulated city taxi unions, prepaid counter notes, base fares, and estimated per-kilometer tariffs.
  - ✈️ **Airports**: Sky blue aviation hubs with IATA codes (`DEL`, `BOM`, `GOI`, `BLR`), distance to center, terminal facilities, and estimated taxi transfer fares.
  - 🚆 **Railway Stations**: Indigo rail termini with IRCTC station codes (`NDLS`, `CSMT`, `MAO`, `HWH`), metro connectivity indicators, and cab fares.
  - 📍 **Current Trip Location**: Animated violet radar ping (`animate-ping`) pinpointing the traveler's active itinerary stop.
- **Animated Route Geometry**: High-contrast WebGL line string layers featuring ambient outer casing, luminous center path, and real-time path telemetry.
- **Real-Time Route Telemetry HUD**:
  - 🛣️ **Exact Route Distance**: Kilometers computed via spherical geodesy.
  - ⏱️ **Estimated Travel Time**: Multi-modal travel durations (Drive 🚗, Walk 🚶, Cycle 🚲).
  - 💰 **Estimated Transportation Cost**: Live fare calculations dynamically updating with travel mode.
- **Day-by-Day Itinerary Ribbon & 3D Cinematic Tour**: Switch between day routes directly on the floating map ribbon, or trigger the automated 3D cinematic camera tour flying sequentially along itinerary waypoints.

### 12. 🧭 “I'm Lost / What Now?” Emergency Wayfinding & Recovery Mode (`/trips/[id]/lost`)
- **🆘 Instant One-Touch Emergency Trigger**: Prominently accessible via dedicated `"🆘 I'm Lost"` buttons in the trip header, workspace sub-nav, interactive map controls, and as a dedicated emergency command center route (`/trips/[id]/lost`).
- **📍 Live GPS Lock & Off-Route Deviation Detection**: Browser HTML5 Geolocation lock with fallback simulation (~1.1 km off-route offset) calculating exact distance deviation and 8-point compass bearing (e.g. `North-East (45°)`).
- **🎯 Real-Time Scheduled Stop Synchronization**: Cross-references traveler's active itinerary to show exactly where they are supposed to be right now (e.g. Amber Fort, 10:00 AM – 12:30 PM), along with the subsequent destination.
- **🚶 High-Contrast Turn-by-Turn Wayfinding**: Step-by-step pedestrian walking route with turn directions (`straight`, `left`, `right`, `destination`), segment distances, estimated walking time, and clock arrival time.
- **🚕 Alternative Cab / Auto Route**: Direct motorized route option with live OSRM driving duration and regulated Indian fare estimates (in ₹ INR).
- **🏥 Verified Nearby Safe Public Havens**: Distance-sorted proximity directory of 24/7 Police Stations, Hospitals, Transit Hubs (Metro/Bus/Auto stands), and well-lit Public Cafes with direct `tel:` tap-to-call actions.
- **🗣️ AI Conversational Reassurance & Audio Read-Aloud**: Voice synthesis (Web Speech API) and conversational reassuring guidance: *"You're 1.2 km away from your planned destination. Walk straight for 600 m, then turn left at the main crossing..."*
- **📲 One-Tap Emergency SOS Broadcast**: Instant WhatsApp and SMS distress message sharing featuring exact GPS coordinates, direct Google Maps link, planned destination context, and national emergency helplines (Tourist Helpline 1363, Police 112).

### 13. 🚨 “Emergency Mode” Decision-Support Command Center (`/trips/[id]/emergency`)
- **🚨 Instant One-Button Trigger**: Dedicated high-priority emergency action button (`🚨 EMERGENCY`) accessible across the trip workspace header, workspace navigation bar (`TripWorkspaceNav`), floating MapLibre overlay controls, and as a standalone command center (`/trips/[id]/emergency`).
- **🏥 Decision-Support Healthcare & Haven Directory**:
  - 🏥 **Nearby Hospitals**: 24/7 trauma centers and district hospitals with direct `tel:` dialing, street address, proximity in km/m, and travel time.
  - 👮 **Police Stations**: Tourist police assistance posts, headquarters, and local stations with one-touch phone dispatch.
  - 💊 **Pharmacies & Chemists**: 24/7 retail pharmacies (Apollo Pharmacy, MedPlus, Government Jan Aushadhi counters) with operating hours and contact lines.
  - 🏛️ **Embassies & Consulates**: Authoritative diplomatic missions across India (US, UK, Australia, France, Germany, Canada, Japan) with 24/7 emergency citizen consular assistance lines.
- **📞 Universal One-Tap Emergency Helplines**: Instant click-to-call buttons for nationwide services: 112 (Universal ERSS), 108 (Ambulance/Trauma), 100 (Police), and 1363 (Tourist Helpline).
- **📍 Live GPS Pin & Booked Hotel Address**: High-accuracy HTML5 Geolocation coordinate lock (`±Xm`), Google Maps pin link, and traveler's active accommodation with direct desk dialing.
- **🧭 Interactive Turn-by-Turn Wayfinding**: Pedestrian and driving navigation routes to nearest medical, police, pharmacy, or hotel facility with step directions and clock ETA.
- **📲 "Share My Location" with Emergency Contacts**: One-click location broadcast via WhatsApp, SMS, Web Share API, and clipboard copy targeting selected personal emergency contacts.
- **⚖️ Decision-Support Invariant**: Prominently displays legal/ethical notices clarifying that this is an offline decision-support tool, not an emergency dispatch replacement, directing immediate 112/108 calling in life-threatening scenarios.

### 14. 🛡️ “Is This Place Safe for Me?” Travel Comfort & Environmental Signals Profile
- **📊 Factual Public Signals Over Black-Box Scores**: Replaces arbitrary AI pseudo-safety scores with verifiable, transparent public signals derived from municipal registries, Archaeological Survey of India (ASI) operating hours, OpenStreetMap (OSM) transit nodes, and Open-Meteo atmospheric telemetry:
  - 🟢 / 🟡 / 🔴 **Crowd Level**: Hourly pedestrian density, ticket queue delays, and peak congestion windows.
  - 🟢 / 🟡 / 🔴 **Late-Night Access & Illumination**: Street lighting infrastructure, commercial corridor activity, and closing gates.
  - 🟢 / 🟡 / 🔴 **Public & Emergency Transit Connectivity**: Proximity to metro stations, bus terminals, autorickshaw stands, and arterial corridors.
  - 🟢 / 🟡 / 🔴 **Tourist Density & Community Presence**: Verified presence of state tourist police kiosks, family-friendly dwell zones, and licensed guides.
  - 🟢 / 🟡 / 🔴 **Weather & Environmental Exposure**: Real-time heat stress, torrential precipitation risk, unshaded exposure, and wave advisories.
- **⏰ Actionable "Better Time to Visit" Windows**: Explicit guidance (e.g. *9:00 AM – 6:00 PM* for heritage monuments, *6:30 AM – 10:30 AM & 4:30 PM – 7:30 PM* for coastal beaches) coupled with clear operational rationales (daylight illumination, heat avoidance, active lifeguard supervision).
- **🔎 Ubiquitous Availability**:
  - Embedded as interactive comfort badges (`PlaceComfortBadge`) in attraction catalog cards.
  - Embedded in scheduled itinerary stop timelines (`/trips/[id]`).
  - Integrated into interactive MapLibre map popups with instant modal triggers.
- **🛡️ Transparency & Anti-Harm Invariant**: Prominently cites official authorities (ASI, Incredible India, OpenStreetMap, Open-Meteo) and explicitly disclaims authoritative certainty to reinforce traveler situational awareness.

---

## 🛠️ Tech Stack & Cloud Primitives

| Component | Technology | Free-Tier Service |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2 (App Router, Server & Client Components) | [Vercel](https://vercel.com) |
| **Language** | TypeScript (Strict mode, Node.js 20+) | Open Source |
| **Styling** | Tailwind CSS, Lucide Icons, shadcn/ui primitives | Open Source |
| **Database** | Supabase (PostgreSQL 15 + PostGIS 3.3 + pgvector) | [Supabase Free Tier](https://supabase.com) |
| **Local DB Fallback** | Atomic File-Persistent JSON Engine (`data/app-db.json`) | Built-in |
| **Authentication** | Supabase Auth SSR + Dual-Layer Session Cookie Bridge | [Supabase Auth](https://supabase.com) |
| **AI LLM** | Google Gemini 1.5 Flash via `@google/generative-ai` | [Google AI Studio](https://aistudio.google.com/) |
| **Vector Embeddings** | Gemini `text-embedding-004` (768 dimensions) | [Google AI Studio](https://aistudio.google.com/) |
| **Interactive Maps** | MapLibre GL JS (WebGL GPU-accelerated 3D Terrain & Routes) | Open Source |
| **Geospatial & Routing** | OpenStreetMap (OSM) + Open Source Routing Machine (OSRM) | Public APIs |
| **Meteorology** | Open-Meteo Weather Forecast API | Public API (No key required) |
| **Deployment** | Vercel Edge & Serverless Functions | [Vercel Hobby Tier](https://vercel.com) |

---

## 📂 Project Structure

```
c:\Rimjhim Roams\
├── data/
│   └── app-db.json               # Local persistent database for zero-config deployments
├── docs/
│   ├── architecture.md           # High-level architecture documentation
│   ├── database.md               # PostgreSQL schemas and migration reference
│   ├── rag.md                    # Travel RAG retrieval architecture
│   ├── roadmap.md                # Phased implementation roadmap
│   └── technical_implementation.md # Comprehensive technical specifications
├── public/
│   ├── image (My trip)/          # My Trips vintage compass background assets
│   ├── videos/
│   │   └── landing-page.mp4      # Cinematic hero video
│   └── hero-fallback.jpg         # High-resolution poster fallback
├── src/
│   ├── app/
│   │   ├── (auth)/login & register # Responsive authentication portals
│   │   ├── admin/knowledge/      # Knowledge base RAG console
│   │   ├── api/                  # 30+ RESTful API route handlers
│   │   ├── assistant/            # Global AI Travel Copilot console
│   │   ├── dashboard/            # Traveler command center
│   │   ├── explore/              # India tourism & NATMO explorer
│   │   ├── memories/             # Travel photo & memory vault
│   │   ├── profile/              # Traveler preference tuning
│   │   ├── trips/                # Trips directory, planner & detail views
│   │   ├── layout.tsx            # Global layout & background animations
│   │   └── page.tsx              # Root cinematic landing page
│   ├── components/
│   │   ├── background/           # Topography & Auth aurora animations
│   │   ├── landing/              # Hero, panel, feature grid, and travel modes
│   │   ├── navigation.tsx        # Responsive sticky glass header
│   │   └── ui/                   # Reusable UI component library
│   ├── lib/
│   │   ├── ai/                   # Gemini & deterministic model providers
│   │   ├── auth/                 # Centralized getActiveUser / session resolver
│   │   ├── db/                   # Persistent atomic JSON database
│   │   ├── rag/                  # Semantic search and ingestion pipelines
│   │   ├── security/             # Sliding-window rate limiter & injection defenses
│   │   ├── services/             # Domain logic (budget, time, trips, weather)
│   │   ├── supabase/             # Safe SSR browser & server client factories
│   │   └── validation/           # Zod-style schema validators
│   └── middleware.ts             # Edge route protection & session bridge
├── supabase/
│   └── migrations/               # Production SQL migrations (PostGIS + pgvector)
├── test/                         # 291 automated unit & integration tests across 31 test suites
└── vercel.json                   # Vercel deployment configuration
```

---

## 🚦 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/sourabhsk0001/Rimjhim-Roams.git
cd "Rimjhim Roams"
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local` (optional for local mock testing, required for live external cloud):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_DAILY_USER_LIMIT=20
GEMINI_DAILY_SERVER_LIMIT=1000

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: Rimjhim Roams is built with **zero-config fallbacks**. If no environment variables are provided, the system automatically runs using the persistent local database (`data/app-db.json`), deterministic AI planners, and local vector retrieval.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Demo Login Credentials
- **Traveler Demo**: `demo@tripwise.ai` / `password123`
- **Admin Demo**: `admin@tripwise.ai` / `admin123`

---

## 🧪 Testing & Verification

The project includes **291 automated tests** covering security, Gemini daily quotas, sliding-window rate limiting, role-based access control, deterministic tool calling, PostGIS queries, RAG ingestion, prompt injection defense, and authentication:

```bash
# Run the complete test suite
npm test

# Run TypeScript strict type verification
npm run typecheck

# Run production build compilation
npm run build
```

---

## 🚢 Vercel Deployment

1. Push your code to your GitHub repository.
2. In the **Vercel Dashboard**, click **Import Project** and select your repository.
3. Configure **Build & Development Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Install Command**: `npm install`
4. *(Optional)* Add your Supabase and Gemini keys in **Settings > Environment Variables**.
5. Click **Deploy**. The application builds and deploys cleanly with zero errors!

---

## 📚 Technical Documentation

Comprehensive architectural and implementation guides are located in the [`docs/`](file:///c:/Rimjhim%20Roams/docs) directory:
- [Technical Implementation Guide (`docs/technical_implementation.md`)](file:///c:/Rimjhim%20Roams/docs/technical_implementation.md) — Detailed technical specifications, data flows, and security architectures.
- [System Architecture (`docs/architecture.md`)](file:///c:/Rimjhim%20Roams/docs/architecture.md) — High-level component topology and system flowcharts.
- [Database & Migrations Guide (`docs/database.md`)](file:///c:/Rimjhim%20Roams/docs/database.md) — Schema DDL, RLS policies, spatial queries, and pgvector indices.
- [Travel RAG Engine (`docs/rag.md`)](file:///c:/Rimjhim%20Roams/docs/rag.md) — Semantic retrieval, sliding window chunking, and injection sanitization.
- [Phased Project Roadmap (`docs/roadmap.md`)](file:///c:/Rimjhim%20Roams/docs/roadmap.md) — Complete 15-phase developmental roadmap and milestones.

---

## 📄 License & Attribution
Released under the [Apache License, Version 2.0](LICENSE).

### Attribution Requirement
When using, reproducing, modifying, or distributing this codebase, software, or any derivative works, you **MUST** prominently credit the project owner and cite the original repository:
- **Project Owner**: Sourabh Kumar ([@sourabhsk0001](https://github.com/sourabhsk0001))
- **Repository**: [https://github.com/sourabhsk0001/Rimjhim-Roams](https://github.com/sourabhsk0001/Rimjhim-Roams)
- **Notice Specification**: See [`NOTICE`](NOTICE) for Section 4(d) attribution details.
