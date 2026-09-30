-- ==============================================================================
-- Migration: 20241003000000_budget_and_expenses.sql
-- Description: Phase 4 Deterministic Travel Budget, Price Snapshots, and Expenses
-- ==============================================================================

-- 1. Price Snapshots Table (Stores frozen price points for deterministic calculations)
CREATE TABLE IF NOT EXISTS public.price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  item_type varchar(50) NOT NULL CHECK (item_type IN ('hotel', 'attraction', 'transport', 'restaurant', 'local_transport')),
  item_id varchar(100) NOT NULL,
  item_name varchar(255) NOT NULL,
  price_minor_units bigint NOT NULL CHECK (price_minor_units >= 0),
  currency varchar(10) DEFAULT 'INR' NOT NULL,
  snapshot_date timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for quick lookup by trip
CREATE INDEX IF NOT EXISTS idx_price_snapshots_trip_id ON public.price_snapshots(trip_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_item ON public.price_snapshots(item_type, item_id);

-- 2. Expenses Table (Tracks actual traveler expenditures against projected budgets)
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category varchar(50) NOT NULL CHECK (
    category IN (
      'transport',
      'hotel',
      'food',
      'local_transport',
      'activities',
      'shopping',
      'emergency_buffer',
      'other'
    )
  ),
  title varchar(255) NOT NULL,
  amount_minor_units bigint NOT NULL CHECK (amount_minor_units >= 0),
  currency varchar(10) DEFAULT 'INR' NOT NULL,
  paid_at timestamptz DEFAULT now() NOT NULL,
  payment_method varchar(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'credit_card', 'debit_card', 'net_banking', 'other')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for expense lookups
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

-- Enable Row Level Security
ALTER TABLE public.price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS Policies: Price Snapshots
-- Trip owner or authorized member can view and manage price snapshots
-- ==============================================================================

CREATE POLICY "Users can view price snapshots for authorized trips"
  ON public.price_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = price_snapshots.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert price snapshots for their trips"
  ON public.price_snapshots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = price_snapshots.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can delete price snapshots for their trips"
  ON public.price_snapshots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = price_snapshots.trip_id
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
-- RLS Policies: Expenses
-- ==============================================================================

CREATE POLICY "Users can view expenses for authorized trips"
  ON public.expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expenses.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert expenses for authorized trips"
  ON public.expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expenses.trip_id
      AND (
        t.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.trip_members tm
          WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can update their own expenses or trips they own"
  ON public.expenses
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expenses.trip_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own expenses or trips they own"
  ON public.expenses
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = expenses.trip_id AND t.user_id = auth.uid()
    )
  );

-- Trigger for auto-updating updated_at on expenses
CREATE OR REPLACE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
