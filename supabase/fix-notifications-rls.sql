-- ============================================
-- Fix Notifications RLS - Add INSERT Policy
-- Run this in Supabase SQL Editor
-- ============================================

-- Add INSERT policy for notifications
-- Users can create notifications where they are the actor (the one performing the action)
CREATE POLICY "Users can insert notifications as actor"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = actor_id);
