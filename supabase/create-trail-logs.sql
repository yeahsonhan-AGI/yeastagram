-- ============================================
-- Trail Logs Table
-- Run this in Supabase SQL Editor
-- ============================================

-- Create trail_logs table
CREATE TABLE IF NOT EXISTS public.trail_logs (
  -- Basic Information
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hiking', 'climbing', 'backpacking')),

  -- Time Information
  duration_type TEXT NOT NULL CHECK (duration_type IN ('single_day', 'multi_day')),
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL for single_day trips

  -- Route Data
  distance_km DECIMAL(10,2),
  elevation_gain_m INTEGER,
  elevation_loss_m INTEGER,
  max_altitude_m INTEGER,
  location_name TEXT,
  coordinates_lat DECIMAL(10,8),
  coordinates_lng DECIMAL(11,8),

  -- Weather Data
  min_temperature_c INTEGER,
  max_temperature_c INTEGER,
  weather_conditions TEXT[],  -- ['sunny', 'cloudy', 'rain', 'snow', 'wind', 'hail']

  -- User Content
  notes TEXT CHECK (LENGTH(notes) <= 1000),
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard', 'extreme')),

  -- Social Features
  is_private BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (
    (duration_type = 'single_day' AND end_date IS NULL) OR
    (duration_type = 'multi_day' AND end_date IS NOT NULL AND end_date >= start_date)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trail_logs_user_id ON public.trail_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_logs_created_at ON public.trail_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trail_logs_type ON public.trail_logs(type);
CREATE INDEX IF NOT EXISTS idx_trail_logs_is_private ON public.trail_logs(is_private);
CREATE INDEX IF NOT EXISTS idx_trail_logs_start_date ON public.trail_logs(start_date DESC);

-- Enable Row Level Security
ALTER TABLE public.trail_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public trail logs are viewable by everyone"
  ON public.trail_logs FOR SELECT
  USING (NOT is_private OR auth.uid() = user_id);

CREATE POLICY "Users can insert own trail logs"
  ON public.trail_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trail logs"
  ON public.trail_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trail logs"
  ON public.trail_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trail_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trail_logs_updated_at_trigger
  BEFORE UPDATE ON public.trail_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_trail_logs_updated_at();

-- Verification query
SELECT 'trail_logs table created successfully' as status;
