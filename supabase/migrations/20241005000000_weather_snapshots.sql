-- ==============================================================================
-- Migration: 20241005000000_weather_snapshots.sql
-- Description: Phase 8 Weather Intelligence, Snapshots & Itinerary Correlation
-- ==============================================================================

-- 1. Weather Snapshots Table
CREATE TABLE IF NOT EXISTS public.weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  destination_id varchar(100),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  date date NOT NULL,
  snapshot_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_trip_weather_date UNIQUE (trip_id, date)
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_trip_id ON public.weather_snapshots(trip_id);
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_date ON public.weather_snapshots(date);
CREATE INDEX IF NOT EXISTS idx_weather_snapshots_dest ON public.weather_snapshots(destination_id);

-- 2. Row Level Security (RLS)
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;

-- Helper check for trip access (relies on trips table RLS functions or direct check)
CREATE OR REPLACE FUNCTION public.can_access_weather_trip(check_trip_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = check_trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = check_trip_id
            AND tm.user_id = auth.uid()
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for weather_snapshots
CREATE POLICY "Users can view weather snapshots for authorized trips"
  ON public.weather_snapshots
  FOR SELECT
  USING (public.can_access_weather_trip(trip_id));

CREATE POLICY "Users can insert weather snapshots for authorized trips"
  ON public.weather_snapshots
  FOR INSERT
  WITH CHECK (public.can_access_weather_trip(trip_id));

CREATE POLICY "Users can update weather snapshots for authorized trips"
  ON public.weather_snapshots
  FOR UPDATE
  USING (public.can_access_weather_trip(trip_id))
  WITH CHECK (public.can_access_weather_trip(trip_id));

CREATE POLICY "Users can delete weather snapshots for authorized trips"
  ON public.weather_snapshots
  FOR DELETE
  USING (public.can_access_weather_trip(trip_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_weather_snapshots_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_weather_snapshots_updated
  BEFORE UPDATE ON public.weather_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_weather_snapshots_updated_at();
