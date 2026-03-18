'use client'

import Link from 'next/link'
import { Users, Calendar, MapPin, Lock, Globe, UserPlus } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Group } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface GroupCardProps {
  group: Group
  onJoin?: (groupId: string) => void
  isMember?: boolean
}

export function GroupCard({ group, onJoin, isMember = false }: GroupCardProps) {
  const activityColor = group.activity_type === 'hiking'
    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'

  const activityLabel = group.activity_type === 'hiking' ? 'Hiking' : 'Mountain Climbing'

  const joinTypeLabel = {
    open: 'Open',
    request: 'Request',
    invite_only: 'Invite Only'
  }[group.join_type]

  const handleJoin = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onJoin?.(group.id)
  }

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md cursor-pointer">
        {group.cover_photo_url && (
          <div className="relative h-40 w-full overflow-hidden">
            <img
              src={group.cover_photo_url}
              alt={group.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge className={cn(activityColor, 'border-0')}>
                {activityLabel}
              </Badge>
              <Badge variant={group.is_public ? 'default' : 'secondary'} className="gap-1">
                {group.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {joinTypeLabel}
              </Badge>
            </div>
          </div>
        )}

        <CardHeader className="pb-3 px-4">
          <h3 className="font-semibold text-lg line-clamp-1">{group.name}</h3>
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {group.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="pb-3 px-4">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(group.start_date).toLocaleDateString('en-US')}</span>
              {group.end_date && (
                <span> - {new Date(group.end_date).toLocaleDateString('en-US')}</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group.members_count}/{group.max_members}</span>
            </div>
          </div>

          {group.leader && (
            <div className="flex items-center gap-2 mt-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={group.leader.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {group.leader.username?.[0] || group.leader.full_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                Leader: {group.leader.username || group.leader.full_name || 'User'}
              </span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-0 px-4">
          <span className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true, locale: enUS })}
          </span>
          {!isMember && group.is_public && (
            <Button size="default" className="rounded-full h-10 px-4" onClick={handleJoin}>
              <UserPlus className="h-4 w-4 mr-1" />
              <span className="text-sm">{group.join_type === 'open' ? 'Join' : 'Request'}</span>
            </Button>
          )}
          {isMember && (
            <Badge variant="default" className="bg-primary">Joined</Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
