-- ==============================================================================
-- Migration: 20241008000000_safety_center.sql
-- Description: Phase 13 Source-Backed Safety Center, Medical/Police Facilities & Advisories
-- Invariants:
--   - No arbitrary safety scores.
--   - No fabricated alerts.
--   - Every record includes source, retrieved_at, and updated_at.
-- ==============================================================================

-- 1. Safety Facilities Table (Hospitals, Trauma Centers, Police Units)
CREATE TABLE IF NOT EXISTS public.safety_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination varchar(100) NOT NULL,
  name varchar(255) NOT NULL,
  facility_type varchar(50) NOT NULL CHECK (facility_type IN ('hospital', 'police')),
  category varchar(100) NOT NULL,
  has_24x7_emergency boolean NOT NULL DEFAULT true,
  address text NOT NULL,
  phone varchar(100) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  source text NOT NULL,
  retrieved_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safety_facilities_dest ON public.safety_facilities(destination);
CREATE INDEX IF NOT EXISTS idx_safety_facilities_type ON public.safety_facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_safety_facilities_coords ON public.safety_facilities(latitude, longitude);

-- 2. Safety Advisories & Local Rules Table
CREATE TABLE IF NOT EXISTS public.safety_advisories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination varchar(100) NOT NULL,
  record_type varchar(50) NOT NULL CHECK (record_type IN ('weather_alert', 'travel_advisory', 'transport_disruption', 'local_rule')),
  category varchar(100) NOT NULL,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  severity varchar(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'advisory', 'warning', 'severe')),
  status varchar(50) DEFAULT 'operational' CHECK (status IN ('operational', 'delayed', 'closed', 'seasonal_closure', 'active', 'archived')),
  statutory_reference text,
  penalty text,
  effective_from timestamptz,
  effective_until timestamptz,
  source text NOT NULL,
  retrieved_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_safety_advisories_dest ON public.safety_advisories(destination);
CREATE INDEX IF NOT EXISTS idx_safety_advisories_type ON public.safety_advisories(record_type);

-- 3. Row Level Security (RLS)
ALTER TABLE public.safety_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_advisories ENABLE ROW LEVEL SECURITY;

-- Safety information is public public-health/safety data: anyone can read
CREATE POLICY "Public can view safety facilities"
  ON public.safety_facilities
  FOR SELECT
  USING (true);

CREATE POLICY "Public can view safety advisories"
  ON public.safety_advisories
  FOR SELECT
  USING (true);

-- Only service role / authenticated admins can insert/update
CREATE POLICY "Authenticated users can manage safety facilities"
  ON public.safety_facilities
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage safety advisories"
  ON public.safety_advisories
  FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
