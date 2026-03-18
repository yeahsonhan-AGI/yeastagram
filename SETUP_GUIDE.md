# Supabase Setup Guide for Yeahstagram

Follow these steps to set up your Supabase project for Yeahstagram.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended) or create an account
4. Click "New Project"
5. Fill in:
   - **Name**: yeahstagram (or your preferred name)
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
6. Wait for the project to be provisioned (~2 minutes)

## Step 2: Get Your Credentials

1. Go to Project Settings > API
2. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 3: Set Environment Variables

In your project root, create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Click "New Query"
3. Copy the SQL from `lib/db/schema.ts` (the `schemaSQL` export)
4. Paste and click "Run" or press Ctrl+Enter

This creates:
- All tables (profiles, posts, likes, comments, follows, notifications)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic follow count updates
- Trigger for new user profile creation

## Step 5: Create Storage Buckets

### Create "posts" bucket

1. Go to Storage in the left sidebar
2. Click "Create a new bucket"
3. Name: `posts`
4. Make it **Public**
5. Click "Create bucket"

### Create "avatars" bucket

1. Click "Create a new bucket" again
2. Name: `avatars`
3. Make it **Public**
4. Click "Create bucket"

## Step 6: Set Storage Policies

### For "posts" bucket:

1. Click on the "posts" bucket
2. Go to "Policies" tab
3. Click "New Policy" > "For full customization" > "Use this template"

**Insert Policy (Authenticated users can upload):**
```sql
CREATE POLICY "Authenticated users can upload posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');
```

**Select Policy (Public can view):**
```sql
CREATE POLICY "Public can view posts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');
```

**Delete Policy (Users can delete own posts):**
```sql
CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### For "avatars" bucket:

**Insert Policy:**
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');
```

**Select Policy:**
```sql
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

**Update Policy:**
```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 7: Enable OAuth Providers (Optional)

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Yeahstagram
   - **Homepage URL**: `http://localhost:3000` (dev) or your domain
   - **Authorization callback URL**: `https://xxxxx.supabase.co/auth/v1/callback`
4. Copy Client ID and generate Client Secret
5. In Supabase > Authentication > Providers > GitHub:
   - Enable GitHub provider
   - Paste Client ID and Secret
   - Save

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to APIs & Services > Credentials
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
6. In Supabase > Authentication > Providers > Google:
   - Enable Google provider
   - Paste Client ID and Secret
   - Save

## Step 8: Update Redirect URLs

In Supabase > Authentication > URL Configuration:

Add to "Redirect URLs":
```
http://localhost:3000/auth/callback
```

(For production, add your domain instead of localhost)

## Step 9: Test Your Setup

1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Try signing up with email
4. Create a post
5. Verify data appears in Supabase Table Editor

## Troubleshooting

### "No rows returned" errors
- Make sure RLS policies are created
- Check that policies allow access for `authenticated` role

### Storage upload errors
- Verify bucket is public
- Check storage policies are applied
- Ensure user is authenticated

### OAuth not working
- Double-check callback URLs
- Verify redirect URLs match exactly
- Check provider credentials are correct

### Follow count not updating
- Make sure trigger function was created
- Check that trigger is attached to follows table

## Need Help?

- Check Supabase docs: https://supabase.com/docs
- Report issues on GitHub
