-- ============================================
-- Supabase Storage Setup for Yeahstagram
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for avatars bucket
-- Allow anyone to view avatars
CREATE POLICY "Avatar images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Create policies for posts bucket
-- Allow anyone to view post images
CREATE POLICY "Post images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

-- Allow authenticated users to upload posts
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Create a function to get the folder name from a path
CREATE OR REPLACE FUNCTION storage.foldername(path text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE STRICT
AS $$
  SELECT string_to_array(path, '/');
$$;
