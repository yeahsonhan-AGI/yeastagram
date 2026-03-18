-- ============================================
-- Add group_id column and group notification types to notifications table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add group_id column to notifications table
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Drop the old check constraint
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new check constraint with group notification types
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('like', 'comment', 'follow', 'group_request', 'group_request_approved', 'group_request_rejected'));

-- Create index for group_id
CREATE INDEX IF NOT EXISTS notifications_group_id_idx ON public.notifications(group_id);

-- Add INSERT policy for group notifications (admin client can bypass, but this helps with service role)
-- Since we're using admin client for notifications, this is mostly for documentation
CREATE POLICY IF NOT EXISTS "Users can insert notifications as actor"
ON public.notifications
FOR INSERT
TO anon, authenticated
WITH CHECK (false); -- Only service role should insert notifications
