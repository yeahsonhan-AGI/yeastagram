-- ============================================
-- Fix Avatars Bucket RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing policies on Avatars bucket (if any)
DROP POLICY IF EXISTS "Avatar images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Create policies for Avatars bucket (case-sensitive)
-- Allow anyone to view avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Avatars');

-- Allow authenticated users to update avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (bucket_id = 'Avatars');
