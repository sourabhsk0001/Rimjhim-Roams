-- ==============================================================================
-- Migration: 20241004000000_time_and_itineraries.sql
-- Description: Phase 5 Time Intelligence Engine, Itineraries, Items & Route Segments
-- ==============================================================================

-- 1. Itineraries Table (Days within a trip)
CREATE TABLE IF NOT EXISTS public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  day_number int NOT NULL CHECK (day_number > 0),
  date date NOT NULL,
  title varchar(255),
  theme varchar(255),
  day_start_time time DEFAULT '08:30:00' NOT NULL,
  day_end_time time DEFAULT '21:00:00' NOT NULL,
  status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_trip_day UNIQUE (trip_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON public.itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_date ON public.itineraries(date);

-- 2. Itinerary Items Table (Individual activities, sights, transit, meals, and rest blocks)
-- CRITICAL REQUIREMENT: visit_minutes, travel_minutes, waiting_minutes, and buffer_minutes
-- are kept strictly separate and NEVER combined internally.
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  attraction_id varchar(100),
  title varchar(255) NOT NULL,
  category varchar(50) NOT NULL CHECK (
    category IN ('sightseeing', 'food', 'travel', 'rest', 'activity', 'lodging')
  ),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location jsonb NOT NULL,
  visit_minutes int DEFAULT 0 NOT NULL CHECK (visit_minutes >= 0),
  travel_minutes int DEFAULT 0 NOT NULL CHECK (travel_minutes >= 0),
  waiting_minutes int DEFAULT 0 NOT NULL CHECK (waiting_minutes >= 0),
  buffer_minutes int DEFAULT 0 NOT NULL CHECK (buffer_minutes >= 0),
  estimated_cost int DEFAULT 0 NOT NULL CHECK (estimated_cost >= 0),
  priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('must_visit', 'high', 'medium', 'low')),
  status varchar(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped')),
  duration_tier varchar(20) DEFAULT 'Normal' CHECK (duration_tier IN ('Quick', 'Normal', 'Relaxed')),
  sort_order int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON public.itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_trip_id ON public.itinerary_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_date ON public.itinerary_items(date);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_sort ON public.itinerary_items(itinerary_id, sort_order);

-- 3. Route Segments Table (Exact geographic transit between consecutive itinerary items)
CREATE TABLE IF NOT EXISTS public.route_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  from_item_id uuid REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
  to_item_id uuid REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
  mode varchar(30) DEFAULT 'driving' CHECK (mode IN ('driving', 'walking', 'cycling', 'transit')),
  distance_meters int DEFAULT 0 NOT NULL CHECK (distance_meters >= 0),
  duration_seconds int DEFAULT 0 NOT NULL CHECK (duration_seconds >= 0),
  polyline jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_segments_itinerary ON public.route_segments(itinerary_id);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_segments ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS Policies: Itineraries
-- ==============================================================================

CREATE POLICY "Users can view itineraries for authorized trips"
  ON public.itineraries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itineraries.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert itineraries for authorized trips"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itineraries.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can update itineraries for authorized trips"
  ON public.itineraries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itineraries.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can delete itineraries for authorized trips"
  ON public.itineraries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itineraries.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

-- ==============================================================================
-- RLS Policies: Itinerary Items
-- ==============================================================================

CREATE POLICY "Users can view itinerary items for authorized trips"
  ON public.itinerary_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itinerary_items.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert itinerary items for authorized trips"
  ON public.itinerary_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itinerary_items.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can update itinerary items for authorized trips"
  ON public.itinerary_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itinerary_items.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can delete itinerary items for authorized trips"
  ON public.itinerary_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = itinerary_items.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

-- ==============================================================================
-- RLS Policies: Route Segments
-- ==============================================================================

CREATE POLICY "Users can view route segments for authorized trips"
  ON public.route_segments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      JOIN public.trips t ON t.id = i.trip_id
      WHERE i.id = route_segments.itinerary_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can manage route segments for authorized trips"
  ON public.route_segments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      JOIN public.trips t ON t.id = i.trip_id
      WHERE i.id = route_segments.itinerary_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
