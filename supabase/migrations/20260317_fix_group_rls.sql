-- ============================================
-- Fix RLS Policy Circular Dependency
-- ============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can add members" ON public.group_members;

-- Create new policy that allows group leader to view their own groups (without checking group_members)
CREATE POLICY "Group leaders can view their groups"
ON public.groups FOR SELECT
USING (
  leader_id = auth.uid()
);

-- Allow users to view groups where they are the leader (redundant but safe)
CREATE POLICY "Users can view their own led groups"
ON public.groups FOR SELECT
USING (
  leader_id = auth.uid()
);

-- For the INSERT policy on group_members, use a simpler approach
-- Check if the user is the leader by directly comparing with leader_id from the inserted row
-- This avoids the circular dependency

-- First, we need to grant access to groups table for the check
-- We'll use a subquery that bypasses the RLS check using the raw table

CREATE POLICY "Group leaders can add members (fixed)"
ON public.group_members FOR INSERT
WITH CHECK (
  -- Direct check: the user being added must be done by the group leader
  -- We check if the current user (auth.uid()) is the leader of the group being referenced
  EXISTS (
    SELECT 1
    FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Alternative: Also allow users to add themselves when joining open groups
CREATE POLICY "Users can join open groups"
ON public.group_members FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.join_type = 'open'
  )
);

-- Make sure group leaders can always view their group members
CREATE POLICY "Group leaders can view all members"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Make sure members can view other members in their groups
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);
