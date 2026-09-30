# Rimjhim Roams — Database Architecture & Schema

This document details the PostgreSQL schema, Row Level Security (RLS) policies, spatial indexing, and vector primitives for Rimjhim Roams (TripWise AI).

---

## 1. Overview & Extensions

- **Database**: PostgreSQL (Supabase Free Tier)
- **Primary Extensions**:
  - `uuid-ossp` / `pgcrypto`: Generates standard UUIDs for all primary keys.
  - `postgis`: Enables geospatial spatial queries, spherical distance calculations (`ST_Distance`), and bounding box queries (`ST_DWithin`).
  - `pgvector`: Enables vector embeddings (768 or 1536 dim) for semantic destination matching.

### Migration History:
1. Phase 1 Schema: [`supabase/migrations/20241001000000_initial_schema.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241001000000_initial_schema.sql)
2. Phase 2 Travel Data: [`supabase/migrations/20241002000000_core_travel_data.sql`](file:///C:/Rimjhim%20Roams/supabase/migrations/20241002000000_core_travel_data.sql)

---

## 2. Table Schemas

### A. User & Travel Itinerary Domain (Phase 1)

#### `public.profiles`
Stores foundational user profile attributes linked 1:1 with `auth.users`.
- `id` (UUID, Primary Key, references `auth.users.id` on delete cascade)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

#### `public.traveller_profiles`
Stores traveler-specific details such as nationality and emergency contacts.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `user_id` (UUID, UNIQUE, references `auth.users.id` on delete cascade)
- `nationality` (TEXT)
- `phone_number` (TEXT)
- `bio` (TEXT)
- `emergency_contact` (JSONB)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `updated_at` (TIMESTAMPTZ, default `now()`)

#### `public.travel_preferences`
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

#### `public.trips`
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

#### `public.trip_members`
Collaborator and access control mapping for shared itineraries.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `trip_id` (UUID, references `public.trips.id` on delete cascade)
- `user_id` (UUID, references `auth.users.id` on delete cascade)
- `role` (TEXT, check in `'owner'`, `'editor'`, `'viewer'`, default `'editor'`)
- `created_at` (TIMESTAMPTZ, default `now()`)
- `UNIQUE(trip_id, user_id)`

---

### B. Core Travel Data Catalog (Phase 2)

All catalog entities support native latitude / longitude floating-point values and generate an indexed PostGIS `geography(Point, 4326)` column.

#### `public.destinations`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `name` (TEXT, NOT NULL)
- `state_province` (TEXT, NOT NULL)
- `country` (TEXT, NOT NULL, default `'India'`)
- `description` (TEXT, NOT NULL)
- `latitude` (DOUBLE PRECISION, NOT NULL)
- `longitude` (DOUBLE PRECISION, NOT NULL)
- `geom` (`GEOGRAPHY(Point, 4326)`, generated stored from coordinates)
- `climate` (TEXT, NOT NULL)
- `best_time_to_visit` (TEXT, NOT NULL)
- `hero_image` (TEXT)
- `source` (TEXT, NOT NULL, default `'DEMO'`)
- `data_status` (TEXT, NOT NULL, default `'DEMO'`)
- `created_at` & `updated_at` (TIMESTAMPTZ)

#### `public.attractions`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `destination_id` (UUID, references `public.destinations.id` on delete cascade)
- `name` (TEXT, NOT NULL)
- `description` (TEXT, NOT NULL)
- `category` (TEXT, NOT NULL)
- `latitude` & `longitude` (DOUBLE PRECISION, NOT NULL)
- `geom` (`GEOGRAPHY(Point, 4326)`)
- `opening_time` & `closing_time` (TEXT, NOT NULL)
- `ticket_price` (NUMERIC(10,2), default `0`)
- `currency` (VARCHAR(10), default `'INR'`)
- `minimum_visit_minutes` (INTEGER, default `30`)
- `recommended_visit_minutes` (INTEGER, default `90`)
- `maximum_visit_minutes` (INTEGER, default `180`)
- `best_visit_start` & `best_visit_end` (TEXT, NOT NULL)
- `peak_start` & `peak_end` (TEXT, NOT NULL)
- `estimated_queue_minutes` (INTEGER, default `0`)
- `weather_suitability` (TEXT, NOT NULL)
- `source` & `data_status` (TEXT, default `'DEMO'`)

#### `public.hotels`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `destination_id` (UUID, references `public.destinations.id` on delete cascade)
- `name` (TEXT, NOT NULL)
- `latitude` & `longitude` (DOUBLE PRECISION, NOT NULL)
- `geom` (`GEOGRAPHY(Point, 4326)`)
- `price_per_night` (NUMERIC(10,2), NOT NULL)
- `currency` (VARCHAR(10), default `'INR'`)
- `rating` (NUMERIC(3,1), default `4.0`)
- `amenities` (TEXT[], default `'{}'`)
- `source` & `data_status` (TEXT, default `'DEMO'`)

#### `public.restaurants`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `destination_id` (UUID, references `public.destinations.id` on delete cascade)
- `name` (TEXT, NOT NULL)
- `latitude` & `longitude` (DOUBLE PRECISION, NOT NULL)
- `geom` (`GEOGRAPHY(Point, 4326)`)
- `cuisine` (TEXT, NOT NULL)
- `price_level` (TEXT, NOT NULL)
- `estimated_price_per_person` (NUMERIC(10,2), NOT NULL)
- `dietary_options` (TEXT[], default `'{}'`)
- `source` & `data_status` (TEXT, default `'DEMO'`)

#### `public.transport_options`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `destination_id` (UUID, references `public.destinations.id` on delete cascade)
- `origin` & `destination` (TEXT, NOT NULL)
- `mode` (TEXT, NOT NULL: `flight`, `train`, `bus`, `ferry`)
- `provider` (TEXT, NOT NULL)
- `departure` & `arrival` (TEXT, NOT NULL)
- `duration_minutes` (INTEGER, NOT NULL)
- `price` (NUMERIC(10,2), NOT NULL)
- `currency` (VARCHAR(10), default `'INR'`)
- `transfers` (INTEGER, default `0`)
- `source` & `data_status` (TEXT, default `'DEMO'`)

#### `public.taxi_options`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `destination_id` (UUID, references `public.destinations.id` on delete cascade)
- `name` (TEXT, NOT NULL)
- `vehicle_type` (TEXT, NOT NULL)
- `base_fare` (NUMERIC(10,2), NOT NULL)
- `price_per_km` (NUMERIC(10,2), NOT NULL)
- `currency` (VARCHAR(10), default `'INR'`)
- `source` & `data_status` (TEXT, default `'DEMO'`)

#### `public.reviews`
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `entity_type` (TEXT, check in `'destination'`, `'attraction'`, `'hotel'`, `'restaurant'`)
- `entity_id` (UUID, NOT NULL)
- `user_id` (UUID, references `auth.users.id` on delete set null)
- `author_name` (TEXT, NOT NULL)
- `rating` (NUMERIC(2,1), check `1.0 <= rating <= 5.0`)
- `comment` (TEXT, NOT NULL)
- `source` (TEXT, default `'DEMO'`)

---

## 3. PostGIS Spatial Functions & Indexes

- **Spatial Indexes**:
  ```sql
  CREATE INDEX idx_destinations_geom ON public.destinations USING GIST (geom);
  CREATE INDEX idx_attractions_geom ON public.attractions USING GIST (geom);
  CREATE INDEX idx_hotels_geom ON public.hotels USING GIST (geom);
  CREATE INDEX idx_restaurants_geom ON public.restaurants USING GIST (geom);
  ```

- **Stored Procedure `find_nearby_attractions`**:
  ```sql
  CREATE OR REPLACE FUNCTION public.find_nearby_attractions(
    target_lat DOUBLE PRECISION,
    target_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 15.0
  )
  RETURNS TABLE (...)
  ```
  Uses `ST_DWithin` with GIST index traversal for sub-millisecond radius searches.
