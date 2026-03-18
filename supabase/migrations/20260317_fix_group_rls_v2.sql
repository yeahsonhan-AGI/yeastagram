-- ============================================
-- 修复组队功能 RLS 策略 - 使用 SECURITY DEFINER 函数
-- ============================================

-- 创建 SECURITY DEFINER 函数检查用户是否是队伍队长
-- 这个函数以 postgres 用户的权限运行，可以绕过 RLS
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

-- 删除有问题的策略
DROP POLICY IF EXISTS "Group leaders can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view their own led groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can add members (fixed)" ON public.group_members;
DROP POLICY IF EXISTS "Users can join open groups" ON public.group_members;
DROP POLICY IF EXISTS "Group leaders can view all members" ON public.group_members;
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;

-- ============ groups 表策略 ============

-- 公开队伍所有人可见
CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (is_public = true);

-- 队长可以查看自己的队伍（使用 SECURITY DEFINER 函数）
CREATE POLICY "Group leaders can view their groups"
ON public.groups FOR SELECT
USING (is_group_leader(id, auth.uid()));

-- 成员可以查看自己所在的队伍
CREATE POLICY "Group members can view their groups"
ON public.groups FOR SELECT
USING (is_group_member(id, auth.uid()));

-- 任何人都可以创建队伍（自己成为队长）
CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = leader_id);

-- 只有队长可以更新队伍
CREATE POLICY "Group leaders can update their groups"
ON public.groups FOR UPDATE
USING (leader_id = auth.uid());

-- 只有队长可以删除队伍
CREATE POLICY "Group leaders can delete their groups"
ON public.groups FOR DELETE
USING (leader_id = auth.uid());

-- ============ group_members 表策略 ============

-- 队长可以查看队伍的所有成员
CREATE POLICY "Group leaders can view members"
ON public.group_members FOR SELECT
USING (is_group_leader(group_id, auth.uid()));

-- 成员可以查看同队伍的成员
CREATE POLICY "Members can view other members"
ON public.group_members FOR SELECT
USING (
  user_id = auth.uid()
  OR is_group_member(group_id, auth.uid())
);

-- 队长可以添加成员
CREATE POLICY "Group leaders can add members"
ON public.group_members FOR INSERT
WITH CHECK (is_group_leader(group_id, auth.uid()));

-- 用户可以加入公开队伍
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

-- 队长可以移除成员
CREATE POLICY "Group leaders can remove members"
ON public.group_members FOR DELETE
USING (is_group_leader(group_id, auth.uid()));

-- 成员可以离开队伍（除了队长）
CREATE POLICY "Members can leave groups"
ON public.group_members FOR DELETE
USING (
  user_id = auth.uid()
  AND NOT is_group_leader(group_id, auth.uid())
);

-- ============ group_shared_itinerary 表策略 ============

-- 成员可以查看共享行程
CREATE POLICY "Members can view itinerary"
ON public.group_shared_itinerary FOR SELECT
USING (is_group_member(group_id, auth.uid()));

-- 队长或成员可以创建共享行程
CREATE POLICY "Members can create itinerary"
ON public.group_shared_itinerary FOR INSERT
WITH CHECK (is_group_member(group_id, auth.uid()));

-- 成员可以更新共享行程
CREATE POLICY "Members can update itinerary"
ON public.group_shared_itinerary FOR UPDATE
USING (is_group_member(group_id, auth.uid()));

-- ============ group_itinerary_days 表策略 ============

-- 成员可以查看行程天数
CREATE POLICY "Members can view itinerary days"
ON public.group_itinerary_days FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

-- 队长或成员可以添加行程天数
CREATE POLICY "Members can create itinerary days"
ON public.group_itinerary_days FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

-- 成员可以更新行程天数
CREATE POLICY "Members can update itinerary days"
ON public.group_itinerary_days FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.group_shared_itinerary
    WHERE group_shared_itinerary.id = group_itinerary_days.itinerary_id
    AND is_group_member(group_shared_itinerary.group_id, auth.uid())
  )
);

-- 队长可以删除行程天数
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

-- 成员可以查看费用
CREATE POLICY "Members can view expenses"
ON public.group_expenses FOR SELECT
USING (is_group_member(group_id, auth.uid()));

-- 成员可以添加费用
CREATE POLICY "Members can create expenses"
ON public.group_expenses FOR INSERT
WITH CHECK (
  payer_id = auth.uid()
  AND is_group_member(group_id, auth.uid())
);

-- 支付者可以更新费用
CREATE POLICY "Payers can update expenses"
ON public.group_expenses FOR UPDATE
USING (payer_id = auth.uid());

-- 队长或支付者可以删除费用
CREATE POLICY "Leaders and payers can delete expenses"
ON public.group_expenses FOR DELETE
USING (
  payer_id = auth.uid()
  OR is_group_leader(group_id, auth.uid())
);

-- ============ group_expense_splits 表策略 ============

-- 成员可以查看费用分摊
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

-- 成员可以查看消息
CREATE POLICY "Members can view messages"
ON public.group_messages FOR SELECT
USING (is_group_member(group_id, auth.uid()));

-- 成员可以发送消息
CREATE POLICY "Members can send messages"
ON public.group_messages FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND is_group_member(group_id, auth.uid())
);

-- 发送者可以删除自己的消息
CREATE POLICY "Users can delete their messages"
ON public.group_messages FOR DELETE
USING (user_id = auth.uid());

-- ============ group_join_requests 表策略 ============

-- 队长可以查看申请
CREATE POLICY "Leaders can view requests"
ON public.group_join_requests FOR SELECT
USING (is_group_leader(group_id, auth.uid()));

-- 申请者可以查看自己的申请
CREATE POLICY "Users can view their requests"
ON public.group_join_requests FOR SELECT
USING (user_id = auth.uid());

-- 用户可以创建加入申请
CREATE POLICY "Users can create join requests"
ON public.group_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 队长可以更新（审批）申请
CREATE POLICY "Leaders can respond to requests"
ON public.group_join_requests FOR UPDATE
USING (is_group_leader(group_id, auth.uid()));
