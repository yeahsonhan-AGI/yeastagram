-- Add INSERT policy for group_expense_splits
-- This allows group members to create expense splits when adding expenses

CREATE POLICY "Group members can insert expense splits"
ON public.group_expense_splits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_expenses
    WHERE group_expenses.id = group_expense_splits.expense_id
    AND is_group_member(group_expenses.group_id, auth.uid())
  )
);
