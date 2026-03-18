# Yeahstagram - Instagram Clone

A modern Instagram clone built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Features

- ✅ User authentication (Email/Password, GitHub, Google OAuth)
- ✅ Photo upload and post creation
- ✅ Feed with posts from followed users
- ✅ Like and comment on posts
- ✅ Follow/unfollow users
- ✅ User profiles with bio and stats
- ✅ Edit profile with avatar upload
- ✅ Explore page with all posts
- ✅ Responsive design (mobile & desktop)
- ✅ Real-time updates

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database schema from `lib/db/schema.ts`
4. Create storage buckets for "posts" and "avatars"
5. Set up storage policies

### 3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
yeahstagram/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (main)/          # Main app pages
│   │   ├── page.tsx     # Home/feed
│   │   ├── explore/     # Explore page
│   │   ├── create/      # Create post
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── [username]/  # User profiles
│   │   └── p/[postId]/  # Individual posts
│   └── auth/callback/   # OAuth callback
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/
│   ├── feed/
│   ├── profile/
│   └── explore/
├── lib/
│   ├── supabase/        # Supabase client setup
│   └── db/              # Database queries & schema
└── types/               # TypeScript types
```

## Database Schema

- **profiles** - User profiles
- **posts** - User posts
- **likes** - Post likes
- **comments** - Post comments
- **follows** - User relationships
- **notifications** - User notifications

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT License - feel free to use this project for learning or as a starting point.
