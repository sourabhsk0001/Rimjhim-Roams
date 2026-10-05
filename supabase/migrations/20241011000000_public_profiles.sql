-- ==============================================================================
-- Rimjhim Roams (TripWise AI) — Public Profiles & Community Explorer Migration
-- Migration: 20241011000000_public_profiles.sql
-- Description: Public profile tables with strict clean-format constraints and RLS separation
-- ==============================================================================

-- 1. Create Public Profiles Table
-- Separated from private 'profiles' and 'traveller_profiles' (which hold email, phone, emergency contacts)
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  home_city VARCHAR(80),
  travel_style TEXT NOT NULL DEFAULT 'balanced',
  visited_states_count INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] NOT NULL DEFAULT '{}'::text[],
  top_destinations TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Clean-format CHECK constraints
  CONSTRAINT chk_public_profile_username_clean 
    CHECK (username ~ '^[a-z0-9_-]{3,30}$'),
  CONSTRAINT chk_public_profile_display_name_clean 
    CHECK (length(trim(display_name)) >= 2 AND length(display_name) <= 50 AND display_name !~ '[<>]'),
  CONSTRAINT chk_public_profile_bio_clean 
    CHECK (bio IS NULL OR (length(bio) <= 300 AND bio !~ '[<>]')),
  CONSTRAINT chk_public_profile_home_city_clean 
    CHECK (home_city IS NULL OR (length(home_city) <= 80 AND home_city !~ '[<>]')),
  CONSTRAINT chk_public_profile_travel_style 
    CHECK (travel_style IN ('backpacker', 'cultural', 'luxury', 'adventure', 'photographer', 'slow_travel', 'road_tripper', 'balanced')),
  CONSTRAINT chk_public_profile_visited_states 
    CHECK (visited_states_count >= 0 AND visited_states_count <= 36),
  CONSTRAINT chk_public_profile_avatar_url 
    CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://[^\s<>"]+$' OR avatar_url ~ '^/[^\s<>"]+$')
);

-- Indexes for lightning-fast search and explorer discovery
CREATE INDEX IF NOT EXISTS idx_public_profiles_username ON public.public_profiles(username);
CREATE INDEX IF NOT EXISTS idx_public_profiles_user_id ON public.public_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_public_profiles_travel_style ON public.public_profiles(travel_style);
CREATE INDEX IF NOT EXISTS idx_public_profiles_is_public ON public.public_profiles(is_public);

-- 2. Row Level Security (RLS) Separation
-- This guarantees the public profiles table is accessible publicly while preventing tampering.
-- Private tables (public.profiles, public.traveller_profiles) remain strictly locked down to auth.uid() = id/user_id.
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous travellers) can view public profiles
CREATE POLICY "Public profiles are readable by everyone when public"
  ON public.public_profiles FOR SELECT
  USING (is_public = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));

-- Users can only insert their own public profile
CREATE POLICY "Users can insert their own public profile"
  ON public.public_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can only update their own public profile
CREATE POLICY "Users can update their own public profile"
  ON public.public_profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Users can only delete their own public profile
CREATE POLICY "Users can delete their own public profile"
  ON public.public_profiles FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ==============================================================================
-- 3. Seed Sample Public Explorer Profiles
-- Pre-configured authentic travel profiles representing diverse Indian circuits
-- ==============================================================================

INSERT INTO public.public_profiles (
  username,
  display_name,
  bio,
  avatar_url,
  home_city,
  travel_style,
  visited_states_count,
  badges,
  top_destinations,
  is_public
) VALUES
  (
    'priya_travels',
    'Priya Sharma',
    'Heritage researcher and temple architecture enthusiast exploring living history across India.',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'Jaipur, Rajasthan',
    'cultural',
    24,
    ARRAY['Heritage Curator', 'Temple Architecture', 'Golden Triangle Explorer'],
    ARRAY['Jaipur', 'Hampi', 'Varanasi', 'Khajuraho'],
    true
  ),
  (
    'kabir_peaks',
    'Kabir Singh',
    'High-altitude trekker, mountaineer, and certified wilderness first responder documenting trans-Himalayan passes.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'Manali, Himachal Pradesh',
    'adventure',
    14,
    ARRAY['Himalayan Pioneer', 'Altitude Chaser', 'Wilderness Certified'],
    ARRAY['Spiti Valley', 'Leh Ladakh', 'Rohtang Pass', 'Zanskar'],
    true
  ),
  (
    'ananya_coastal',
    'Ananya Roy',
    'Landscape photographer chasing monsoons, coastal lighthouses, and pristine backwaters across the subcontinent.',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'Kolkata, West Bengal',
    'photographer',
    19,
    ARRAY['Coastal Nomad', 'Sunset Chaser', 'Monsoon Chronicler'],
    ARRAY['Gokarna', 'Varkala', 'Havelock Island', 'Puri'],
    true
  ),
  (
    'vikram_royal',
    'Vikramaditya Rathore',
    'Culinary explorer and royal heritage enthusiast discovering heritage havelis and slow-cooked regional gastronomy.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'Udaipur, Rajasthan',
    'luxury',
    18,
    ARRAY['Palace Connoisseur', 'Royal Gastronomy', 'Heritage Restorer'],
    ARRAY['Udaipur', 'Jodhpur', 'Gwalior', 'Chettinad'],
    true
  ),
  (
    'zoya_slowroad',
    'Zoya Merchant',
    'Advocate for sustainable village tourism, organic farm stays, and indigenous craft traditions across Northeast India.',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    'Pune, Maharashtra',
    'slow_travel',
    22,
    ARRAY['Eco Wanderer', 'Living Root Bridges', 'Village Chronicler'],
    ARRAY['Mawlynnong', 'Ziro Valley', 'Coorg', 'Majuli'],
    true
  )
ON CONFLICT (username) DO NOTHING;
