'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Group } from '@/types'
import { Users, Calendar, Lock } from 'lucide-react'

interface ProfileGroupsGridProps {
  groups: Group[]
}

export function ProfileGroupsGrid({ groups }: ProfileGroupsGridProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">No groups yet</p>
          <p className="text-sm text-muted-foreground">Join a community of fellow adventurers</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getActivityLabel = (activityType?: string) => {
    return activityType === 'hiking' ? 'Hiking' : 'Climbing'
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/groups/${group.id}`}
          className="block group touch-manipulation"
        >
          <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl border hover:border-primary/50 transition-colors min-h-[100px] sm:min-h-[120px]">
            {/* Cover Photo - Larger on mobile for touch */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {group.cover_photo_url ? (
                <Image
                  src={group.cover_photo_url}
                  alt={group.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Users className="h-8 w-8" />
                </div>
              )}
              {!group.is_public && (
                <div className="absolute top-1.5 right-1.5 bg-black/70 rounded-full p-1">
                  <Lock className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-sm line-clamp-1 mb-1">{group.name}</h3>
                {group.activity_type && (
                  <p className="text-sm sm:text-xs text-muted-foreground mb-1">
                    {getActivityLabel(group.activity_type)}
                  </p>
                )}
                {group.description && (
                  <p className="text-sm sm:text-xs text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{group.members_count || 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(group.start_date)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
