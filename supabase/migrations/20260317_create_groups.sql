-- ============================================
-- Groups Feature Migration
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Groups Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Basic info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('hiking', 'climbing')),

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE,

  -- Cover photo
  cover_photo_url TEXT,

  -- Privacy settings
  is_public BOOLEAN DEFAULT false,
  join_type TEXT NOT NULL DEFAULT 'request' CHECK (join_type IN ('open', 'request', 'invite_only')),

  -- Member limit
  max_members INTEGER DEFAULT 10,

  -- Associated trip (optional)
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,

  -- Statistics
  members_count INTEGER DEFAULT 1,
  expenses_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================
-- 2. Group Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'admin', 'member')),

  -- Location sharing
  location_sharing_enabled BOOLEAN DEFAULT false,
  last_location_lat DECIMAL(10, 8),
  last_location_lng DECIMAL(11, 8),
  last_location_updated TIMESTAMPTZ,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id, user_id)
);

-- ============================================
-- 3. Group Shared Itinerary Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_shared_itinerary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(200) NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(group_id)
);

-- ============================================
-- 4. Group Itinerary Days Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  itinerary_id UUID REFERENCES public.group_shared_itinerary(id) ON DELETE CASCADE NOT NULL,

  day_number INTEGER NOT NULL,
  log_date DATE NOT NULL,

  start_location TEXT,
  end_location TEXT,
  distance_km DECIMAL(10, 2),
  elevation_gain_m INTEGER,
  elevation_loss_m INTEGER,

  weather_conditions TEXT[],
  gear_suggestions TEXT,
  notes TEXT,

  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(itinerary_id, day_number)
);

-- ============================================
-- 5. Group Expenses Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,

  name VARCHAR(200) NOT NULL,
  payer_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,

  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'custom')),

  expense_date DATE NOT NULL,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Group Expense Splits Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES public.group_expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  amount DECIMAL(10, 2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,

  UNIQUE(expense_id, user_id)
);

-- ============================================
-- 7. Group Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location', 'system')),

  -- Location message
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name TEXT,

  -- System notification metadata
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Group Join Requests Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(group_id, user_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_groups_leader ON public.groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON public.groups(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_groups_trip ON public.groups(trip_id);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_expenses_group ON public.group_expenses(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_expense_splits_expense ON public.group_expense_splits(expense_id);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group ON public.group_join_requests(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_user ON public.group_join_requests(user_id);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Function to update group members_count
CREATE OR REPLACE FUNCTION update_group_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET members_count = GREATEST(members_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_members_count_trigger
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION update_group_members_count();

-- Function to update group expenses_count
CREATE OR REPLACE FUNCTION update_group_expenses_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET expenses_count = expenses_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET expenses_count = GREATEST(expenses_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_expenses_count_trigger
AFTER INSERT OR DELETE ON public.group_expenses
FOR EACH ROW EXECUTE FUNCTION update_group_expenses_count();

-- Function to update group messages_count
CREATE OR REPLACE FUNCTION update_group_messages_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET messages_count = messages_count + 1 WHERE id = NEW.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_messages_count_trigger
AFTER INSERT ON public.group_messages
FOR EACH ROW EXECUTE FUNCTION update_group_messages_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER group_updated_at_trigger
BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION update_group_updated_at();

CREATE TRIGGER itinerary_updated_at_trigger
BEFORE UPDATE ON public.group_shared_itinerary
FOR EACH ROW EXECUTE FUNCTION update_group_updated_at();

CREATE TRIGGER itinerary_day_updated_at_trigger
BEFORE UPDATE ON public.group_itinerary_days
FOR EACH ROW EXECUTE FUNCTION update_group_updated_at();

-- Function to auto-create leader as member when group is created
CREATE OR REPLACE FUNCTION add_leader_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.leader_id, 'leader');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_leader_member_trigger
AFTER INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION add_leader_as_member();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all group tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_shared_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups

-- Public groups are viewable by everyone
CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (is_public = true);

-- Group members can view their groups
CREATE POLICY "Group members can view their groups"
ON public.groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- Anyone can create a group (they become leader)
CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = leader_id);

-- Only group leader can update group
CREATE POLICY "Group leaders can update their groups"
ON public.groups FOR UPDATE
USING (
  leader_id = auth.uid()
);

-- Only group leader can delete group
CREATE POLICY "Group leaders can delete their groups"
ON public.groups FOR DELETE
USING (
  leader_id = auth.uid()
);

-- RLS Policies for group_members

-- Group members can view members of their groups
CREATE POLICY "Group members can view group members"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
  )
);

-- Only group leader/admin can add members (handled by app logic for join requests)
CREATE POLICY "Group leaders can add members"
ON public.group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Only group leader can remove members (except themselves)
CREATE POLICY "Group leaders can remove members"
ON public.group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_members.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Members can leave groups (delete their own membership, unless leader)
CREATE POLICY "Members can leave groups"
ON public.group_members FOR DELETE
USING (
  user_id = auth.uid()
  AND user_id != (SELECT leader_id FROM public.groups WHERE id = group_members.group_id)
);

-- RLS Policies for group_shared_itinerary

-- Group members can view shared itinerary
CREATE POLICY "Group members can view shared itinerary"
ON public.group_shared_itinerary FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_shared_itinerary.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Group members can create shared itinerary
CREATE POLICY "Group members can create shared itinerary"
ON public.group_shared_itinerary FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_shared_itinerary.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Group members can update shared itinerary
CREATE POLICY "Group members can update shared itinerary"
ON public.group_shared_itinerary FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_shared_itinerary.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- RLS Policies for group_itinerary_days

-- Group members can view itinerary days
CREATE POLICY "Group members can view itinerary days"
ON public.group_itinerary_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    JOIN public.group_members ON group_members.group_id = group_shared_itinerary.group_id
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND group_members.user_id = auth.uid()
  )
);

-- Group members can create itinerary days
CREATE POLICY "Group members can create itinerary days"
ON public.group_itinerary_days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    JOIN public.group_members ON group_members.group_id = group_shared_itinerary.group_id
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND group_members.user_id = auth.uid()
  )
);

-- RLS Policies for group_expenses

-- Group members can view expenses
CREATE POLICY "Group members can view expenses"
ON public.group_expenses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Group members can create expenses
CREATE POLICY "Group members can create expenses"
ON public.group_expenses FOR INSERT
WITH CHECK (
  auth.uid() = payer_id
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_expenses.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- Only expense creator can update
CREATE POLICY "Expense payer can update expenses"
ON public.group_expenses FOR UPDATE
USING (
  payer_id = auth.uid()
);

-- Only expense creator or group leader can delete
CREATE POLICY "Expense payer or leader can delete expenses"
ON public.group_expenses FOR DELETE
USING (
  payer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_expenses.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- RLS Policies for group_expense_splits

-- Group members can view expense splits for their group
CREATE POLICY "Group members can view expense splits"
ON public.group_expense_splits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_expenses
    JOIN public.group_members ON group_members.group_id = group_expenses.group_id
    WHERE group_expenses.id = group_expense_splits.expense_id
    AND group_members.user_id = auth.uid()
  )
);

-- Users can update their own settlement status
CREATE POLICY "Users can update their own settlement status"
ON public.group_expense_splits FOR UPDATE
USING (
  user_id = auth.uid()
);

-- RLS Policies for group_messages

-- Group members can view messages
CREATE POLICY "Group members can view messages"
ON public.group_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_messages.group_id
    AND group_members.user_id = auth.uid()
  )
  OR message_type = 'system'
);

-- Group members can send messages
CREATE POLICY "Group members can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = group_messages.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- RLS Policies for group_join_requests

-- Users can view their own requests
CREATE POLICY "Users can view their own join requests"
ON public.group_join_requests FOR SELECT
USING (user_id = auth.uid());

-- Group leaders can view requests for their groups
CREATE POLICY "Group leaders can view join requests"
ON public.group_join_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_join_requests.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
ON public.group_join_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Group leaders can update requests (approve/reject)
CREATE POLICY "Group leaders can update join requests"
ON public.group_join_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = group_join_requests.group_id
    AND groups.leader_id = auth.uid()
  )
);

-- Users can delete their pending requests
CREATE POLICY "Users can delete their own pending requests"
ON public.group_join_requests FOR DELETE
USING (
  user_id = auth.uid()
  AND status = 'pending'
);

-- ============================================
-- Grant necessary permissions
-- ============================================

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select on tables for anon (authenticated users)
GRANT SELECT ON public.groups TO anon;
GRANT SELECT ON public.group_members TO anon;
GRANT SELECT ON public.group_shared_itinerary TO anon;
GRANT SELECT ON public.group_itinerary_days TO anon;
GRANT SELECT ON public.group_expenses TO anon;
GRANT SELECT ON public.group_expense_splits TO anon;
GRANT SELECT ON public.group_messages TO anon;
GRANT SELECT ON public.group_join_requests TO anon;

-- Grant all necessary permissions to authenticated users
GRANT ALL ON public.groups TO authenticated;
GRANT ALL ON public.group_members TO authenticated;
GRANT ALL ON public.group_shared_itinerary TO authenticated;
GRANT ALL ON public.group_itinerary_days TO authenticated;
GRANT ALL ON public.group_expenses TO authenticated;
GRANT ALL ON public.group_expense_splits TO authenticated;
GRANT ALL ON public.group_messages TO authenticated;
GRANT ALL ON public.group_join_requests TO authenticated;
