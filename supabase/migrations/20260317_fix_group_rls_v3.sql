-- ============================================
-- 修复组队功能 RLS 策略 - 完整版本
-- ============================================

-- 创建 SECURITY DEFINER 函数检查用户是否是队伍队长
CREATE OR REPLACE FUNCTION is_group_leader(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id = is_group_leader.group_id
    AND groups.leader_id = is_group_leader.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建 SECURITY DEFINER 函数检查用户是否是队伍成员
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = is_group_member.group_id
    AND group_members.user_id = is_group_member.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============ 删除 groups 表的所有旧策略 ============
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Group members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can delete their groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view their own led groups" ON public.groups;

-- ============ 删除 group_members 表的所有旧策略 ============
DROP POLICY IF EXISTS "Group members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Group leaders can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group leaders can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Members can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group leaders can add members (fixed)" ON public.group_members;
DROP POLICY IF EXISTS "Users can join open groups" ON public.group_members;
DROP POLICY IF EXISTS "Group leaders can view all members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

-- ============ 删除 group_shared_itinerary 表的所有旧策略 ============
DROP POLICY IF EXISTS "Group members can view shared itinerary" ON public.group_shared_itinerary;
DROP POLICY IF EXISTS "Group members can create shared itinerary" ON public.group_shared_itinerary;
DROP POLICY IF EXISTS "Group members can update shared itinerary" ON public.group_shared_itinerary;

-- ============ 删除 group_itinerary_days 表的所有旧策略 ============
DROP POLICY IF EXISTS "Group members can view itinerary days" ON public.group_itinerary_days;
DROP POLICY IF EXISTS "Group members can create itinerary days" ON public.group_itinerary_days;
DROP POLICY IF EXISTS "Group members can update itinerary days" ON public.group_itinerary_days;

-- ============ 删除 group_expenses 表的所有旧策略 ============
DROP POLICY IF EXISTS "Members can view expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Members can create expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Payers can update expenses" ON public.group_expenses;
DROP POLICY IF EXISTS "Leaders and payers can delete expenses" ON public.group_expenses;

-- ============ 删除 group_expense_splits 表的所有旧策略 ============
DROP POLICY IF EXISTS "Members can view expense splits" ON public.group_expense_splits;

-- ============ 删除 group_messages 表的所有旧策略 ============
DROP POLICY IF EXISTS "Members can view messages" ON public.group_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON public.group_messages;

-- ============ 删除 group_join_requests 表的所有旧策略 ============
DROP POLICY IF EXISTS "Leaders can view requests" ON public.group_join_requests;
DROP POLICY IF EXISTS "Users can view their requests" ON public.group_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON public.group_join_requests;
DROP POLICY IF EXISTS "Leaders can respond to requests" ON public.group_join_requests;

-- ============================================
-- 创建新的 RLS 策略
-- ============================================

-- ============ groups 表策略 ============

CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (is_public = true);

CREATE POLICY "Group leaders can view their groups"
ON public.groups FOR SELECT
USING (is_group_leader(id, auth.uid()));

CREATE POLICY "Group members can view their groups"
ON public.groups FOR SELECT
USING (is_group_member(id, auth.uid()));

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Group leaders can update their groups"
ON public.groups FOR UPDATE
USING (leader_id = auth.uid());

CREATE POLICY "Group leaders can delete their groups"
ON public.groups FOR DELETE
USING (leader_id = auth.uid());

-- ============ group_members 表策略 ============

CREATE POLICY "Group leaders can view members"
ON public.group_members FOR SELECT
USING (is_group_leader(group_id, auth.uid()));

CREATE POLICY "Members can view other members"
ON public.group_members FOR SELECT
USING (
  user_id = auth.uid()
  OR is_group_member(group_id, auth.uid())
);

CREATE POLICY "Group leaders can add members"
ON public.group_members FOR INSERT
WITH CHECK (is_group_leader(group_id, auth.uid()));

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

CREATE POLICY "Group leaders can remove members"
ON public.group_members FOR DELETE
USING (is_group_leader(group_id, auth.uid()));

CREATE POLICY "Members can leave groups"
ON public.group_members FOR DELETE
USING (
  user_id = auth.uid()
  AND NOT is_group_leader(group_id, auth.uid())
);

-- ============ group_shared_itinerary 表策略 ============

CREATE POLICY "Members can view itinerary"
ON public.group_shared_itinerary FOR SELECT
USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create itinerary"
ON public.group_shared_itinerary FOR INSERT
WITH CHECK (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can update itinerary"
ON public.group_shared_itinerary FOR UPDATE
USING (is_group_member(group_id, auth.uid()));

-- ============ group_itinerary_days 表策略 ============

CREATE POLICY "Members can view itinerary days"
ON public.group_itinerary_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

CREATE POLICY "Members can create itinerary days"
ON public.group_itinerary_days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

CREATE POLICY "Members can update itinerary days"
ON public.group_itinerary_days FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

CREATE POLICY "Leaders can delete itinerary days"
ON public.group_itinerary_days FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary gsi
    JOIN public.groups g ON g.id = gsi.group_id
    WHERE gsi.id = group_itinerary_days.itinerary_id
    AND g.leader_id = auth.uid()
  )
);

-- ============ group_expenses 表策略 ============

CREATE POLICY "Members can view expenses"
ON public.group_expenses FOR SELECT
USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create expenses"
ON public.group_expenses FOR INSERT
WITH CHECK (
  payer_id = auth.uid()
  AND is_group_member(group_id, auth.uid())
);

CREATE POLICY "Payers can update expenses"
ON public.group_expenses FOR UPDATE
USING (payer_id = auth.uid());

CREATE POLICY "Leaders and payers can delete expenses"
ON public.group_expenses FOR DELETE
USING (
  payer_id = auth.uid()
  OR is_group_leader(group_id, auth.uid())
);

-- ============ group_expense_splits 表策略 ============

CREATE POLICY "Members can view expense splits"
ON public.group_expense_splits FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_expenses
    WHERE group_expenses.id = group_expense_splits.expense_id
    AND is_group_member(group_expenses.group_id, auth.uid())
  )
);

-- ============ group_messages 表策略 ============

CREATE POLICY "Members can view messages"
ON public.group_messages FOR SELECT
USING (is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND is_group_member(group_id, auth.uid())
);

CREATE POLICY "Users can delete their messages"
ON public.group_messages FOR DELETE
USING (user_id = auth.uid());

-- ============ group_join_requests 表策略 ============

CREATE POLICY "Leaders can view requests"
ON public.group_join_requests FOR SELECT
USING (is_group_leader(group_id, auth.uid()));

CREATE POLICY "Users can view their requests"
ON public.group_join_requests FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create join requests"
ON public.group_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can respond to requests"
ON public.group_join_requests FOR UPDATE
USING (is_group_leader(group_id, auth.uid()));
