-- ============================================
-- Drop old trail_logs tables (if they exist)
-- ============================================

DROP TABLE IF EXISTS public.trail_comments CASCADE;
DROP TABLE IF EXISTS public.trail_likes CASCADE;
DROP TABLE IF EXISTS public.trail_log_gear CASCADE;
DROP TABLE IF EXISTS public.trail_gear_items CASCADE;
DROP TABLE IF EXISTS public.trail_logs CASCADE;

-- ============================================
-- New Trip & Daily Log Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Trips table (main trip/itinerary)
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  name VARCHAR(200) NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('hiking', 'climbing')),
  duration_type TEXT NOT NULL CHECK (duration_type IN ('single', 'multi')),

  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL for single-day trips

  -- Cover Photo
  cover_photo_url TEXT,

  -- Privacy
  is_public BOOLEAN DEFAULT true,

  -- Computed Stats (updated via triggers)
  total_distance_km DECIMAL(10,2) DEFAULT 0,
  total_elevation_gain_m INTEGER DEFAULT 0,

  -- Social Counts
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (
    (duration_type = 'single' AND end_date IS NULL) OR
    (duration_type = 'multi' AND end_date IS NOT NULL AND end_date >= start_date)
  )
);

-- 2. Daily Logs table (per-day records)
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,

  -- Day info
  day_number INTEGER NOT NULL,  -- 1, 2, 3... for multi-day; 1 for single-day
  log_date DATE NOT NULL,

  -- Locations
  start_location TEXT,
  end_location TEXT,

  -- Stats
  distance_km DECIMAL(10,2),
  elevation_gain_m INTEGER,
  elevation_loss_m INTEGER,

  -- Temperature
  min_temperature_c INTEGER,
  max_temperature_c INTEGER,

  -- Weather (array of conditions)
  weather_conditions TEXT[],

  -- Content
  notes TEXT CHECK (LENGTH(notes) <= 1000),
  photos TEXT[],  -- Array of photo URLs (max 10 photos per log)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one log per day per trip
  CONSTRAINT unique_day_per_trip UNIQUE(trip_id, day_number)
);

-- 3. Gear Categories table
CREATE TABLE IF NOT EXISTS public.gear_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,  -- e.g., "庇护所", "炊具", "衣物"
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Gear Items table
CREATE TABLE IF NOT EXISTS public.gear_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.gear_categories(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  weight_g INTEGER NOT NULL,  -- Weight in grams
  is_packed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Trip Likes (for social interaction)
CREATE TABLE IF NOT EXISTS public.trip_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trip_id)
);

-- 6. Trip Comments
CREATE TABLE IF NOT EXISTS public.trip_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Trips indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_is_public ON public.trips(is_public);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date DESC);

-- Daily logs indexes
CREATE INDEX IF NOT EXISTS idx_daily_logs_trip_id ON public.daily_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_log_date ON public.daily_logs(log_date);

-- Gear indexes
CREATE INDEX IF NOT EXISTS idx_gear_categories_trip_id ON public.gear_categories(trip_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_category_id ON public.gear_items(category_id);

-- Social indexes
CREATE INDEX IF NOT EXISTS idx_trip_likes_trip_id ON public.trip_likes(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_likes_user_id ON public.trip_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON public.trip_comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_created_at ON public.trip_comments(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;

-- Trips RLS Policies
CREATE POLICY "Public trips are viewable by everyone"
  ON public.trips FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- Daily Logs RLS Policies (inherit from trip ownership)
CREATE POLICY "Users can view daily logs of accessible trips"
  ON public.daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = daily_logs.trip_id
      AND (trips.is_public = true OR trips.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage daily logs for own trips"
  ON public.daily_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = daily_logs.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Gear RLS Policies (inherit from trip ownership)
CREATE POLICY "Users can manage gear for own trips"
  ON public.gear_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = gear_categories.trip_id
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage gear items for own trips"
  ON public.gear_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gear_categories
      JOIN public.trips ON trips.id = gear_categories.trip_id
      WHERE gear_categories.id = gear_items.category_id
      AND trips.user_id = auth.uid()
    )
  );

-- Trip Likes RLS
CREATE POLICY "Users can manage own likes"
  ON public.trip_likes FOR ALL
  USING (auth.uid() = user_id);

-- Trip Comments RLS
CREATE POLICY "Everyone can view comments on public trips"
  ON public.trip_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_comments.trip_id
      AND trips.is_public = true
    )
  );

CREATE POLICY "Users can insert comments on public trips"
  ON public.trip_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
      AND trips.is_public = true
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.trip_comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Update trips.updated_at timestamp
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at_trigger
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION update_trips_updated_at();

-- Update daily_logs.updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at_trigger
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_logs_updated_at();

-- Update trip stats when daily log is inserted/updated/deleted
CREATE OR REPLACE FUNCTION update_trip_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add new daily log stats to trip
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km + COALESCE(NEW.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m + COALESCE(NEW.elevation_gain_m, 0)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Recalculate by subtracting old and adding new
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km - COALESCE(OLD.distance_km, 0) + COALESCE(NEW.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m - COALESCE(OLD.elevation_gain_m, 0) + COALESCE(NEW.elevation_gain_m, 0)
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract deleted daily log stats from trip
    UPDATE public.trips
    SET
      total_distance_km = total_distance_km - COALESCE(OLD.distance_km, 0),
      total_elevation_gain_m = total_elevation_gain_m - COALESCE(OLD.elevation_gain_m, 0)
    WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_stats();

-- Update trip likes count
CREATE OR REPLACE FUNCTION update_trip_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trips
    SET likes_count = likes_count + 1
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trips
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_likes_count_trigger
  AFTER INSERT OR DELETE ON public.trip_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_likes_count();

-- Update trip comments count
CREATE OR REPLACE FUNCTION update_trip_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trips
    SET comments_count = comments_count + 1
    WHERE id = NEW.trip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trips
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.trip_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_comments_count_trigger
  AFTER INSERT OR DELETE ON public.trip_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_comments_count();

-- ============================================
-- Verification
-- ============================================

SELECT
  'New schema created successfully' as status,
  (SELECT COUNT(*) FROM public.trips) as trips_count,
  (SELECT COUNT(*) FROM public.daily_logs) as daily_logs_count,
  (SELECT COUNT(*) FROM public.gear_categories) as gear_categories_count,
  (SELECT COUNT(*) FROM public.gear_items) as gear_items_count;
