# Rimjhim Roams — Database Architecture & Schema

This document details the PostgreSQL schema, Row Level Security (RLS) policies, and spatial/vector primitives for Rimjhim Roams (TripWise AI).

---

## 1. Overview & Extensions

- **Database**: PostgreSQL (Supabase Free Tier)
- **Primary Extensions**:
  - `uuid-ossp` / `pgcrypto`: Generates standard UUIDs for all primary keys.
  - `postgis`: Enables geospatial spatial queries, distance calculations, and bounding box queries.
  - `pgvector`: Enables vector embeddings (768 or 1536 dim) for semantic destination matching.

Migration file located at: [`supabase/migrations/20241001000000_initial_schema.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241001000000_initial_schema.sql)

---

## 2. Table Schemas

### `public.profiles`
Stores foundational user profile attributes linked 1:1 with `auth.users`.
- `id` (UUID, Primary Key, references `auth.users.id` on delete cascade)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

### `public.traveller_profiles`
Stores traveler-specific details such as nationality and emergency contacts.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id` (UUID, UNIQUE, references `auth.users.id` on delete cascade)
- `nationality` (TEXT)
- `phone_number` (TEXT)
- `bio` (TEXT)
- `emergency_contact` (JSONB)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

### `public.travel_preferences`
Stores AI itinerary generation preferences and calibration parameters.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id` (UUID, UNIQUE, references `auth.users.id` on delete cascade)
- `preferred_pace` (TEXT, check in `'relaxed'`, `'moderate'`, `'fast-paced'`, default `'moderate'`)
- `budget_tier` (TEXT, check in `'budget'`, `'moderate'`, `'luxury'`, default `'moderate'`)
- `dietary_restrictions` (TEXT[])
- `interests` (TEXT[])
- `preferred_accommodation` (TEXT, default `'hotel'`)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

### `public.trips`
Core itinerary record.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id` (UUID, references `auth.users.id` on delete cascade)
- `origin` (TEXT, NOT NULL)
- `destination` (TEXT, NOT NULL, default `'destination discovery required'`)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `duration_days` (INTEGER, check `duration_days > 0`)
- `budget` (NUMERIC(12,2), check `budget >= 0`)
- `currency` (VARCHAR(10), default `'USD'`)
- `traveller_count` (INTEGER, check `traveller_count > 0`, default `1`)
- `traveller_type` (TEXT, default `'solo'`)
- `travel_pace` (TEXT, default `'moderate'`)
- `preferences` (JSONB, default `'{}'`)
- `status` (TEXT, check in `'planning'`, `'confirmed'`, `'in_progress'`, `'completed'`, `'cancelled'`, default `'planning'`)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

### `public.trip_members`
Collaborator and access control mapping for shared itineraries.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `trip_id` (UUID, references `public.trips.id` on delete cascade)
- `user_id` (UUID, references `auth.users.id` on delete cascade)
- `role` (TEXT, check in `'owner'`, `'editor'`, `'viewer'`, default `'editor'`)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `UNIQUE(trip_id, user_id)`

---

## 3. Row Level Security (RLS) Policies

All tables have RLS strictly enabled (`ENABLE ROW LEVEL SECURITY`).

1. **Isolation**:
   - `profiles`, `traveller_profiles`, and `travel_preferences` can only be queried, inserted, or updated by the matching `auth.uid() = user_id`.
2. **Trip Authorization**:
   - Users can only read `trips` where `auth.uid() = user_id` OR their user ID is present in `trip_members`.
   - Users can only edit `trips` if they are the owner or have the `editor` role in `trip_members`.
   - Only trip owners can delete their trips.
3. **Trip Members Access**:
   - Only trip owners can add or modify trip member invitations.

---

## 4. Database Triggers & Automation

1. **Trip Owner Membership Trigger (`on_trip_created`)**:
   Automatically records the creator of any trip into `trip_members` with role `'owner'`.
2. **Updated Timestamp Trigger (`set_current_timestamp_updated_at`)**:
   Automatically updates `updated_at = timezone('utc'::text, now())` prior to any update operation on tables.
