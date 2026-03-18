-- ============================================
-- Trail Social Features Tables (Likes & Comments)
-- Run this in Supabase SQL Editor
-- ============================================

-- Create trail_likes table
CREATE TABLE IF NOT EXISTS public.trail_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trail_log_id UUID REFERENCES public.trail_logs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trail_log_id)
);

-- Create indexes for trail_likes
CREATE INDEX IF NOT EXISTS idx_trail_likes_trail_log_id ON public.trail_likes(trail_log_id);
CREATE INDEX IF NOT EXISTS idx_trail_likes_user_id ON public.trail_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_likes_created_at ON public.trail_likes(created_at DESC);

-- Enable RLS for trail_likes
ALTER TABLE public.trail_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes"
  ON public.trail_likes FOR ALL
  USING (auth.uid() = user_id);

-- Create function to update trail likes count
CREATE OR REPLACE FUNCTION update_trail_likes_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trail_logs
    SET likes_count = likes_count + 1
    WHERE id = NEW.trail_log_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trail_logs
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.trail_log_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic likes count update
DROP TRIGGER IF EXISTS trail_likes_count_trigger ON public.trail_likes;
CREATE TRIGGER trail_likes_count_trigger
  AFTER INSERT OR DELETE ON public.trail_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_trail_likes_count();

-- Create trail_comments table
CREATE TABLE IF NOT EXISTS public.trail_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trail_log_id UUID REFERENCES public.trail_logs(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for trail_comments
CREATE INDEX IF NOT EXISTS idx_trail_comments_trail_log_id ON public.trail_comments(trail_log_id);
CREATE INDEX IF NOT EXISTS idx_trail_comments_user_id ON public.trail_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_comments_created_at ON public.trail_comments(created_at DESC);

-- Enable RLS for trail_comments
ALTER TABLE public.trail_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view comments on public trails"
  ON public.trail_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trail_logs
      WHERE trail_logs.id = trail_comments.trail_log_id
      AND (NOT trail_logs.is_private OR trail_logs.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert comments on public trails"
  ON public.trail_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.trail_logs
      WHERE trail_logs.id = trail_log_id
      AND NOT trail_logs.is_private
    )
  );

CREATE POLICY "Users can delete own comments"
  ON public.trail_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update trail comments count
CREATE OR REPLACE FUNCTION update_trail_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trail_logs
    SET comments_count = comments_count + 1
    WHERE id = NEW.trail_log_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.trail_logs
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.trail_log_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic comments count update
DROP TRIGGER IF EXISTS trail_comments_count_trigger ON public.trail_comments;
CREATE TRIGGER trail_comments_count_trigger
  AFTER INSERT OR DELETE ON public.trail_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_trail_comments_count();

-- Verification query
SELECT
  'trail_likes and trail_comments tables created successfully' as status,
  (SELECT COUNT(*) FROM public.trail_likes) as likes_count,
  (SELECT COUNT(*) FROM public.trail_comments) as comments_count;
