'use client'

import { useState } from 'react'
import { MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EditProfileDialog } from './EditProfileDialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { createFollowNotification } from '@/lib/notifications'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfileHeaderProps {
  profile: Profile
  isOwnProfile: boolean
  isFollowing: boolean
  currentUserId?: string
  postsCount?: number
  tripsCount?: number
  groupsCount?: number
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  currentUserId,
  postsCount = 0,
  tripsCount = 0,
  groupsCount = 0,
}: ProfileHeaderProps) {
  const supabase = createClient()
  const [following, setFollowing] = useState(isFollowing)
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [followersCount, setFollowersCount] = useState(profile.followers_count || 0)

  const handleFollowToggle = async () => {
    if (!currentUserId) return

    setLoading(true)
    try {
      if (following) {
        await supabase
          .from('follows')
          .delete()
          .match({
            follower_id: currentUserId,
            following_id: profile.id,
          })
        setFollowing(false)
        setFollowersCount((prev) => Math.max(0, prev - 1))
        toast({
          title: 'Unfollowed',
          description: `You unfollowed @${profile.username}`,
        })
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: profile.id,
          })
        setFollowing(true)
        setFollowersCount((prev) => prev + 1)
        toast({
          title: 'Following',
          description: `You are now following @${profile.username}`,
        })

        // Create follow notification
        await createFollowNotification(profile.id, currentUserId)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        {/* Avatar - Larger on mobile */}
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto sm:mx-0">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.username || 'User'} />
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {profile.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Stats & Actions */}
        <div className="flex-1 w-full">
          {/* Action Button - Centered on mobile */}
          <div className="flex justify-center sm:justify-start mb-4 sm:mb-3">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="default"
                className="rounded-full min-h-[44px] px-6"
                onClick={() => setEditDialogOpen(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                size="default"
                className={cn(
                  'rounded-full min-h-[44px] px-6',
                  following ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary text-primary-foreground'
                )}
                onClick={handleFollowToggle}
                disabled={loading}
              >
                {following ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="p-2 sm:p-0">
              <div className="font-semibold text-lg sm:text-base">{postsCount}</div>
              <div className="text-xs sm:text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="font-semibold text-lg sm:text-base flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {tripsCount}
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground">Trips</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="font-semibold text-lg sm:text-base flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {groupsCount}
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground">Groups</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="font-semibold text-lg sm:text-base">{followersCount}</div>
              <div className="text-xs sm:text-xs text-muted-foreground">Followers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section - Better mobile typography */}
      <div className="space-y-2">
        {profile.full_name && (
          <p className="font-semibold text-base">{profile.full_name}</p>
        )}
        {profile.bio && (
          <p className="text-[15px] sm:text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        )}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {profile.website}
          </a>
        )}
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profile}
        />
      )}
    </div>
  )
}
