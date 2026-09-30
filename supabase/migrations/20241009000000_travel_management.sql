-- ==============================================================================
-- Migration: 20241009000000_travel_management.sql
-- Description: Phase 14 Travel Management Layer: Packing, Storage Documents, and Bookings
-- ==============================================================================

-- 1. Helper Authorization Functions
CREATE OR REPLACE FUNCTION public.can_access_travel_management_trip(check_trip_id uuid)
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

CREATE OR REPLACE FUNCTION public.can_edit_travel_management_trip(check_trip_id uuid)
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
            AND tm.role IN ('owner', 'editor')
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trip Packing Items Table
CREATE TABLE IF NOT EXISTS public.trip_packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('Clothing', 'Documents', 'Toiletries', 'Electronics', 'Weather', 'Activity-specific')),
  item_name varchar(255) NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  packed boolean NOT NULL DEFAULT false,
  is_custom boolean NOT NULL DEFAULT false,
  essential boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_packing_trip_id ON public.trip_packing_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_packing_category ON public.trip_packing_items(category);
CREATE INDEX IF NOT EXISTS idx_trip_packing_packed ON public.trip_packing_items(packed);

-- 3. Trip Documents Table (Private Storage Metadata)
CREATE TABLE IF NOT EXISTS public.trip_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name varchar(255) NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('ticket', 'hotel_confirmation', 'activity_confirmation', 'other')),
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type varchar(100) NOT NULL DEFAULT 'application/octet-stream',
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_docs_trip_id ON public.trip_documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_docs_type ON public.trip_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_trip_docs_uploaded_by ON public.trip_documents(uploaded_by);

-- 4. Trip Bookings Table
CREATE TABLE IF NOT EXISTS public.trip_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider varchar(255) NOT NULL,
  booking_reference varchar(100),
  type text NOT NULL CHECK (type IN ('flight', 'train', 'bus', 'hotel', 'taxi', 'activity', 'restaurant')),
  date date NOT NULL,
  time time,
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency varchar(10) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('confirmed', 'pending_confirmation', 'cancelled', 'waitlisted')),
  notes text,
  document_id uuid REFERENCES public.trip_documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip_id ON public.trip_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_type ON public.trip_bookings(type);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_status ON public.trip_bookings(status);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_date ON public.trip_bookings(date);

-- 5. Row Level Security (RLS)
ALTER TABLE public.trip_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;

-- Packing Items Policies
CREATE POLICY "Users can view packing items for authorized trips"
  ON public.trip_packing_items
  FOR SELECT
  USING (public.can_access_travel_management_trip(trip_id));

CREATE POLICY "Users can edit packing items for authorized trips"
  ON public.trip_packing_items
  FOR ALL
  USING (public.can_edit_travel_management_trip(trip_id))
  WITH CHECK (public.can_edit_travel_management_trip(trip_id));

-- Documents Policies
CREATE POLICY "Users can view documents metadata for authorized trips"
  ON public.trip_documents
  FOR SELECT
  USING (public.can_access_travel_management_trip(trip_id));

CREATE POLICY "Editors and owners can manage documents for authorized trips"
  ON public.trip_documents
  FOR ALL
  USING (public.can_edit_travel_management_trip(trip_id))
  WITH CHECK (public.can_edit_travel_management_trip(trip_id));

-- Bookings Policies
CREATE POLICY "Users can view bookings for authorized trips"
  ON public.trip_bookings
  FOR SELECT
  USING (public.can_access_travel_management_trip(trip_id));

CREATE POLICY "Editors and owners can manage bookings for authorized trips"
  ON public.trip_bookings
  FOR ALL
  USING (public.can_edit_travel_management_trip(trip_id))
  WITH CHECK (public.can_edit_travel_management_trip(trip_id));

-- 6. Storage Bucket Registration (Private Bucket: travel-documents)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'travel-documents',
  'travel-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/pkpass']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520;
