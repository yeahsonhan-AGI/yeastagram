-- ============================================
-- Add members_count trigger to groups table
-- Run this in Supabase SQL Editor
-- ============================================

-- Function to update members count
CREATE OR REPLACE FUNCTION update_group_members_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment count when member is added
    UPDATE public.groups
    SET members_count = members_count + 1
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement count when member is removed
    UPDATE public.groups
    SET members_count = GREATEST(members_count - 1, 0)
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS group_members_count_trigger ON public.group_members;

-- Create trigger
CREATE TRIGGER group_members_count_trigger
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION update_group_members_count();

-- Fix existing groups with incorrect counts
UPDATE public.groups g
SET members_count = (
  SELECT COUNT(*)
  FROM public.group_members gm
  WHERE gm.group_id = g.id
);
