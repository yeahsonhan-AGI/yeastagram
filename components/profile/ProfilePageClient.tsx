'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileHeader } from './ProfileHeader'
import { ProfilePostsGrid } from './ProfilePostsGrid'
import { ProfileTripsGrid } from './ProfileTripsGrid'
import { ProfileGroupsGrid } from './ProfileGroupsGrid'
import type { Profile, Post, Trip, Group } from '@/types'

interface ProfilePageClientProps {
  profile: Profile
  posts: Post[]
  trips: Trip[]
  groups: Group[]
  isOwnProfile: boolean
  isFollowing: boolean
  currentUserId?: string
}

export function ProfilePageClient({
  profile,
  posts,
  trips,
  groups,
  isOwnProfile,
  isFollowing,
  currentUserId,
}: ProfilePageClientProps) {
  const router = useRouter()

  const handleSettingsClick = () => {
    router.push('/settings')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between py-2">
        <h1 className="text-lg font-bold">{profile.username}</h1>
        {isOwnProfile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={handleSettingsClick}
          >
            <Settings className="h-5 w-5" strokeWidth={2} />
            <span className="sr-only">Settings</span>
          </Button>
        )}
      </div>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        currentUserId={currentUserId}
        postsCount={posts.length}
        tripsCount={trips.length}
        groupsCount={groups.length}
      />

      {/* Tabs - Mobile-friendly with larger touch targets */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-14 sm:h-12">
          <TabsTrigger
            value="posts"
            className="flex-col sm:flex-row gap-0 sm:gap-1.5 py-3 sm:py-2"
          >
            <span className="text-sm font-medium">Posts</span>
            <span className="text-xs opacity-70">{posts.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="trips"
            className="flex-col sm:flex-row gap-0 sm:gap-1.5 py-3 sm:py-2"
          >
            <span className="text-sm font-medium">Trips</span>
            <span className="text-xs opacity-70">{trips.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="flex-col sm:flex-row gap-0 sm:gap-1.5 py-3 sm:py-2"
          >
            <span className="text-sm font-medium">Groups</span>
            <span className="text-xs opacity-70">{groups.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <ProfilePostsGrid posts={posts} />
        </TabsContent>

        <TabsContent value="trips" className="mt-4">
          <ProfileTripsGrid trips={trips} />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <ProfileGroupsGrid groups={groups} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
