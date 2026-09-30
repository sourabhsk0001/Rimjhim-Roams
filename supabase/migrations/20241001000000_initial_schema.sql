-- ==============================================================================
-- Rimjhim Roams (TripWise AI) — Phase 1 Schema Migration
-- ==============================================================================

-- Enable UUID extension and PostGIS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Traveller Profiles Table
CREATE TABLE IF NOT EXISTS public.traveller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nationality TEXT,
  phone_number TEXT,
  bio TEXT,
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Travel Preferences Table
CREATE TABLE IF NOT EXISTS public.travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_pace TEXT NOT NULL DEFAULT 'moderate' CHECK (preferred_pace IN ('relaxed', 'moderate', 'fast-paced')),
  budget_tier TEXT NOT NULL DEFAULT 'moderate' CHECK (budget_tier IN ('budget', 'moderate', 'luxury')),
  dietary_restrictions TEXT[] DEFAULT '{}'::text[],
  interests TEXT[] DEFAULT '{}'::text[],
  preferred_accommodation TEXT DEFAULT 'hotel',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL DEFAULT 'destination discovery required',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  traveller_count INTEGER NOT NULL DEFAULT 1 CHECK (traveller_count > 0),
  traveller_type TEXT NOT NULL DEFAULT 'solo',
  travel_pace TEXT NOT NULL DEFAULT 'moderate',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Trip Members Table (Authorization & Collaborators)
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(trip_id, user_id)
);

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traveller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Traveller Profiles Policies
CREATE POLICY "Users can view their own traveller profile"
  ON public.traveller_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own traveller profile"
  ON public.traveller_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own traveller profile"
  ON public.traveller_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Travel Preferences Policies
CREATE POLICY "Users can view their own travel preferences"
  ON public.travel_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel preferences"
  ON public.travel_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel preferences"
  ON public.travel_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trips Policies
CREATE POLICY "Users can view authorized trips"
  ON public.trips FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their authorized trips"
  ON public.trips FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Owners can delete their trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Trip Members Policies
CREATE POLICY "Members and owners can view trip members"
  ON public.trip_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_members.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can insert members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_members.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can update members"
  ON public.trip_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_members.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners or self can delete member"
  ON public.trip_members FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_members.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- Triggers and Automation
-- ==============================================================================

-- Automatically add trip creator to trip_members with 'owner' role
CREATE OR REPLACE FUNCTION public.handle_new_trip()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.trip_members (trip_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner')
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_created ON public.trips;
CREATE TRIGGER on_trip_created
  AFTER INSERT ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_trip();

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER update_traveller_profiles_updated_at
  BEFORE UPDATE ON public.traveller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER update_travel_preferences_updated_at
  BEFORE UPDATE ON public.travel_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
