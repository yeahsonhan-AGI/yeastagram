-- ============================================
-- Group Invites Feature Migration
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Group Invites Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  max_uses INTEGER DEFAULT 10,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_max_uses CHECK (max_uses > 0),
  CONSTRAINT valid_used_count CHECK (used_count >= 0 AND used_count <= max_uses)
);

-- ============================================
-- 2. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON public.group_invites(code) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_group_invites_group ON public.group_invites(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_inviter ON public.group_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON public.group_invites(status);
CREATE INDEX IF NOT EXISTS idx_group_invites_expires_at ON public.group_invites(expires_at) WHERE status = 'active';

-- ============================================
-- 3. Row Level Security (RLS)
-- ============================================
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- Group leaders can manage invites for their groups
CREATE POLICY "Group leaders can manage invites"
ON public.group_invites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_invites.group_id
    AND groups.leader_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_invites.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Anyone can view active invites (to use them)
CREATE POLICY "Anyone can view active invites"
ON public.group_invites FOR SELECT
USING (status = 'active');

-- Group members can view invites for their group
CREATE POLICY "Group members can view group invites"
ON public.group_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_invites.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- ============================================
-- 4. Functions and Triggers
-- ============================================

-- Function to mark expired invites
CREATE OR REPLACE FUNCTION mark_expired_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if invite has expired
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
  END IF;

  -- Check if invite has reached max uses
  IF NEW.used_count >= NEW.max_uses AND NEW.status = 'active' THEN
    NEW.status := 'expired';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to mark expired invites
CREATE TRIGGER mark_expired_invites_trigger
BEFORE UPDATE ON public.group_invites
FOR EACH ROW EXECUTE FUNCTION mark_expired_invites();

-- Function to clean up expired invites (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
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

-- ============================================
-- 5. Grant permissions
-- ============================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.group_invites TO anon;
GRANT ALL ON public.group_invites TO authenticated;
