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
| **AI Engine** | Google Gemini 1.5 Flash via `@google/generative-ai` | Free Tier (Google AI Studio) |
| **Maps** | Leaflet & OpenStreetMap tiles | Free / Open Source |
| **Routing** | OSRM (Open Source Routing Machine) | Free Public API |
| **Weather** | Open-Meteo API | Free (No API key required) |
| **Deployment** | Vercel | Free Hobby Tier |

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

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests & Build
```bash
# Run unit tests
npm test

# Run production build
npm run build
```

---

## 🏛️ Documentation
- [System Architecture](file:///C:/Rimjhim%20Roams/docs/architecture.md)
- [Phased Project Roadmap](file:///C:/Rimjhim%20Roams/docs/roadmap.md)

---

## 📄 License
MIT
