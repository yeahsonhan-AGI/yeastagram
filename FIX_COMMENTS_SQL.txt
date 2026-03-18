-- ============================================
-- Create trip_comments table and fix issues
-- ============================================

-- Drop if exists
DROP TABLE IF EXISTS public.trip_comments CASCADE;
DROP TRIGGER IF EXISTS trip_comments_count_trigger ON public.trip_comments;
DROP FUNCTION IF EXISTS update_trip_comments_count() CASCADE;

-- Create trip_comments table
CREATE TABLE IF NOT EXISTS public.trip_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_comments_trip_id ON public.trip_comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_comments_created_at ON public.trip_comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.trip_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Everyone can view comments on public trips" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can insert comments on public trips" ON public.trip_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.trip_comments;

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

-- Trigger to update comment count
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

-- Verification
SELECT 'Trip comments table and trigger created successfully' as status,
       (SELECT COUNT(*) FROM public.trip_comments) as comments_count;
