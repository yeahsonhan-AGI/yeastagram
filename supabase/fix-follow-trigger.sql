-- ============================================
-- Fix Follow Trigger - Add SECURITY DEFINER
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mjxnqgtdobxnlujxlgza/sql/new
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS follow_counts_trigger ON public.follows;

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER follow_counts_trigger
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();
