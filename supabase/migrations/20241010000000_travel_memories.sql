-- ==============================================================================
-- Migration: 20241010000000_travel_memories.sql
-- Description: Phase 15 Travel Memories: Useful non-sensitive travel preferences
-- ==============================================================================

-- 1. Travel Memories Table
CREATE TABLE IF NOT EXISTS public.travel_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('like', 'avoid')),
  category text NOT NULL CHECK (category IN ('destination', 'hotel', 'restaurant', 'transit', 'itinerary', 'general')),
  keyword varchar(150) NOT NULL,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for fast lookups by user and categorization
CREATE INDEX IF NOT EXISTS idx_travel_memories_user_id ON public.travel_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_memories_type ON public.travel_memories(type);
CREATE INDEX IF NOT EXISTS idx_travel_memories_category ON public.travel_memories(category);
CREATE INDEX IF NOT EXISTS idx_travel_memories_active ON public.travel_memories(user_id, is_active);

-- 2. Row Level Security (RLS)
ALTER TABLE public.travel_memories ENABLE ROW LEVEL SECURITY;

-- Users can only select their own travel memories
CREATE POLICY "Users can view own travel memories"
  ON public.travel_memories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own travel memories
CREATE POLICY "Users can create own travel memories"
  ON public.travel_memories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own travel memories
CREATE POLICY "Users can update own travel memories"
  ON public.travel_memories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own travel memories
CREATE POLICY "Users can delete own travel memories"
  ON public.travel_memories
  FOR DELETE
  USING (auth.uid() = user_id);
