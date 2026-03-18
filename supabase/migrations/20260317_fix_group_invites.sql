-- ============================================
-- Fix Group Invites Permissions
-- ============================================

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_invites() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invites() TO anon;

-- Make the function SECURITY DEFINER so it can bypass RLS
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.group_invites
  SET status = 'expired'
  WHERE status = 'active'
  AND (
    expires_at IS NOT NULL AND expires_at < NOW()
    OR used_count >= max_uses
  );
END;
$$ LANGUAGE plpgsql;

-- Add policy to allow authenticated users to insert themselves as members via invite
CREATE POLICY "Users can join groups via invite"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_invites
    WHERE group_invites.group_id = group_members.group_id
    AND group_invites.status = 'active'
    AND group_invites.used_count < group_invites.max_uses
    AND (group_invites.expires_at IS NULL OR group_invites.expires_at > NOW())
  )
);
