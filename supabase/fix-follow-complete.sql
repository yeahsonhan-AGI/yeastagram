-- ============================================
-- Complete Fix for Follow Counts (Fixed)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop existing trigger
DROP TRIGGER IF EXISTS follow_counts_trigger ON public.follows;

-- Step 2: Recreate function with SECURITY DEFINER
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

-- Step 3: Recreate trigger
CREATE TRIGGER follow_counts_trigger
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Step 4: Fix followers_count for all users
UPDATE profiles
SET followers_count = sub.count
FROM (
  SELECT following_id, COUNT(*) as count
  FROM follows
  GROUP BY following_id
) sub
WHERE profiles.id = sub.following_id;

-- Step 5: Fix following_count for all users
UPDATE profiles
SET following_count = sub.count
FROM (
  SELECT follower_id, COUNT(*) as count
  FROM follows
  GROUP BY follower_id
) sub
WHERE profiles.id = sub.follower_id;

-- Step 6: Verify the fix
SELECT
  username,
  followers_count,
  following_count,
  (SELECT COUNT(*) FROM follows WHERE following_id = profiles.id) as actual_followers,
  (SELECT COUNT(*) FROM follows WHERE follower_id = profiles.id) as actual_following
FROM profiles
ORDER BY followers_count DESC
LIMIT 10;
