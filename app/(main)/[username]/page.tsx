import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfileByUsername, getUserPosts, getUserTrips, getUserGroups, isFollowing } from '@/lib/db/queries'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'
import type { Profile, Post, Trip, Group } from '@/types'

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = await getProfileByUsername(username)

  if (!profile) {
    notFound()
  }

  // Fetch all data in parallel
  const [posts, trips, groups] = await Promise.all([
    getUserPosts(profile.id, user?.id),
    getUserTrips(profile.id, user?.id),
    getUserGroups(profile.id),
  ])

  const isOwnProfile = user?.id === profile.id
  const following = user ? await isFollowing(user.id, profile.id) : false

  return (
    <ProfilePageClient
      profile={profile}
      posts={posts}
      trips={trips}
      groups={groups}
      isOwnProfile={isOwnProfile}
      isFollowing={following}
      currentUserId={user?.id}
    />
  )
}
