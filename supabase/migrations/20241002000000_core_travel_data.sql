-- ==============================================================================
-- Rimjhim Roams (TripWise AI) — Phase 2: Core Travel Data Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_province TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  climate TEXT NOT NULL DEFAULT 'Tropical',
  best_time_to_visit TEXT NOT NULL,
  hero_image TEXT,
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Attractions Table
CREATE TABLE IF NOT EXISTS public.attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  opening_time TEXT NOT NULL,
  closing_time TEXT NOT NULL,
  ticket_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  minimum_visit_minutes INTEGER NOT NULL DEFAULT 30,
  recommended_visit_minutes INTEGER NOT NULL DEFAULT 90,
  maximum_visit_minutes INTEGER NOT NULL DEFAULT 180,
  best_visit_start TEXT NOT NULL,
  best_visit_end TEXT NOT NULL,
  peak_start TEXT NOT NULL,
  peak_end TEXT NOT NULL,
  estimated_queue_minutes INTEGER NOT NULL DEFAULT 0,
  weather_suitability TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Hotels Table
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  price_per_night NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  rating NUMERIC(3, 1) NOT NULL DEFAULT 4.0,
  amenities TEXT[] NOT NULL DEFAULT '{}'::text[],
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED,
  cuisine TEXT NOT NULL,
  price_level TEXT NOT NULL,
  estimated_price_per_person NUMERIC(10, 2) NOT NULL,
  dietary_options TEXT[] NOT NULL DEFAULT '{}'::text[],
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Transport Options Table
CREATE TABLE IF NOT EXISTS public.transport_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  mode TEXT NOT NULL,
  provider TEXT NOT NULL,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  transfers INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Taxi Options Table
CREATE TABLE IF NOT EXISTS public.taxi_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  base_fare NUMERIC(10, 2) NOT NULL,
  price_per_km NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  source TEXT NOT NULL DEFAULT 'DEMO',
  data_status TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('destination', 'attraction', 'hotel', 'restaurant')),
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Verified Explorer',
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'DEMO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- Spatial Indexes (PostGIS)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_destinations_geom ON public.destinations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_attractions_geom ON public.attractions USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_hotels_geom ON public.hotels USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_restaurants_geom ON public.restaurants USING GIST (geom);

-- ==============================================================================
-- Spatial Functions
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.find_nearby_attractions(
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 15.0
)
RETURNS TABLE (
  id UUID,
  destination_id UUID,
  name TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  ticket_price NUMERIC,
  distance_km DOUBLE PRECISION,
  data_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.destination_id,
    a.name,
    a.category,
    a.latitude,
    a.longitude,
    a.ticket_price,
    ROUND((ST_Distance(a.geom, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography) / 1000.0)::numeric, 2)::double precision AS distance_km,
    a.data_status
  FROM public.attractions a
  WHERE ST_DWithin(a.geom, ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography, radius_km * 1000.0)
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxi_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public Read Policies for Catalog Data
CREATE POLICY "Public read for destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read for attractions" ON public.attractions FOR SELECT USING (true);
CREATE POLICY "Public read for hotels" ON public.hotels FOR SELECT USING (true);
CREATE POLICY "Public read for restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Public read for transport_options" ON public.transport_options FOR SELECT USING (true);
CREATE POLICY "Public read for taxi_options" ON public.taxi_options FOR SELECT USING (true);
CREATE POLICY "Public read for reviews" ON public.reviews FOR SELECT USING (true);
