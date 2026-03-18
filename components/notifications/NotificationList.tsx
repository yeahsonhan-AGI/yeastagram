'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, MessageCircle, UserPlus, Users, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/hooks/use-toast'
import type { Notification } from '@/types'

interface NotificationListProps {
  notifications: Notification[]
  currentUserId: string
}

export function NotificationList({ notifications, currentUserId }: NotificationListProps) {
  const supabase = createClient()

  const handleMarkAsRead = async (notificationId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  }

  const getNotificationText = (notification: Notification) => {
    const actor = notification.actor_profile
    const actorName = actor?.username || 'Someone'
    const actorUrl = actor?.username || 'profile'

    switch (notification.type) {
      case 'like':
        return (
          <>
            <Link href={`/${actorUrl}`} className="font-semibold hover:underline">
              {actorName}
            </Link>
            {' '}liked your post.
          </>
        )
      case 'comment':
        return (
          <>
            <Link href={`/${actorUrl}`} className="font-semibold hover:underline">
              {actorName}
            </Link>
            {' '}commented on your post.
          </>
        )
      case 'follow':
        return (
          <>
            <Link href={`/${actorUrl}`} className="font-semibold hover:underline">
              {actorName}
            </Link>
            {' '}started following you.
          </>
        )
      case 'group_request':
        return (
          <>
            <Link href={`/${actorUrl}`} className="font-semibold hover:underline">
              {actorName}
            </Link>
            {' '}requested to join your group{' '}
            {notification.group && (
              <Link href={`/groups/${notification.group_id}?tab=requests`} className="font-semibold hover:underline">
                {notification.group.name}
              </Link>
            )}
          </>
        )
      case 'group_request_approved':
        return (
          <>
            Your request to join group{' '}
            {notification.group && (
              <Link href={`/groups/${notification.group_id}`} className="font-semibold hover:underline">
                {notification.group.name}
              </Link>
            )}
            {' '}was approved
          </>
        )
      case 'group_request_rejected':
        return (
          <>
            Your request to join group{' '}
            {notification.group && (
              <Link href={`/groups/${notification.group_id}`} className="font-semibold hover:underline">
                {notification.group.name}
              </Link>
            )}
            {' '}was rejected
          </>
        )
      default:
        return null
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" fill="currentColor" />
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'follow':
        return <UserPlus className="h-5 w-5 text-[#2D4A3E]" />
      case 'group_request':
        return <Users className="h-5 w-5 text-orange-500" />
      case 'group_request_approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'group_request_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔔</div>
        <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
        <p className="text-muted-foreground">
          When people interact with your posts, you'll see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const actor = notification.actor_profile
        const isUnread = !notification.read

        return (
          <div
            key={notification.id}
            className={`flex items-start space-x-3 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isUnread ? 'bg-muted/30' : ''}`}
            onClick={() => isUnread && handleMarkAsRead(notification.id)}
          >
            {/* Notification Icon */}
            <div className="flex-shrink-0 mt-1">
              {getNotificationIcon(notification.type)}
            </div>

            {/* Actor Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={actor?.avatar_url || undefined} alt={actor?.username || 'User'} />
                <AvatarFallback className="bg-[#2D4A3E] text-[#FAF8F5] text-sm">
                  {actor?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Notification Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                {getNotificationText(notification)}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Post Thumbnail (for like/comment notifications) */}
            {notification.post && (
              <Link
                href={`/p/${notification.post_id}`}
                className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={notification.post.image_url}
                  alt="Post"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}
