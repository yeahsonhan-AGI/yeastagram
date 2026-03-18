'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Ruler, TrendingUp, Heart, MessageCircle, Lock } from 'lucide-react'
import type { Trip } from '@/types'
import { cn } from '@/lib/utils'

interface TripCardProps {
  trip: Trip
  currentUserId?: string
}

export function TripCard({ trip, currentUserId }: TripCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDistance = (km: number) => {
    return km >= 10 ? `${km.toFixed(1)} km` : `${(km * 1000).toFixed(0)} m`
  }

  const getActivityEmoji = () => {
    return trip.activity_type === 'hiking' ? '🥾' : '🧗'
  }

  const getActivityLabel = () => {
    return trip.activity_type === 'hiking' ? 'Hiking' : 'Climbing'
  }

  const coverPhoto = trip.cover_photo_url || trip.daily_logs?.[0]?.photos?.[0]

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-md cursor-pointer h-full">
        {/* Cover Photo */}
        <div className="relative h-44 bg-muted">
          {coverPhoto ? (
            <Image
              src={coverPhoto}
              alt={trip.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <MapPin className="h-12 w-12" />
            </div>
          )}
          {!trip.is_public && (
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
              <Lock className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getActivityEmoji()}</span>
              <div>
                <h3 className="font-semibold text-base leading-tight line-clamp-1">{trip.name}</h3>
                <p className="text-xs text-muted-foreground">{getActivityLabel()}</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {/* User info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={trip.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {trip.profiles?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {trip.profiles?.username || 'Unknown'}
            </span>
          </div>

          {/* Date range */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {trip.duration_type === 'single' ? (
              <span>{formatDate(trip.start_date)}</span>
            ) : (
              <span>
                {formatDate(trip.start_date)} - {formatDate(trip.end_date!)}
              </span>
            )}
          </div>

          {/* Stats */}
          {(trip.total_distance_km > 0 || trip.total_elevation_gain_m > 0) && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              {trip.total_distance_km > 0 && (
                <div className="flex items-center">
                  <Ruler className="h-3.5 w-3.5 mr-1" />
                  <span>{formatDistance(trip.total_distance_km)}</span>
                </div>
              )}
              {trip.total_elevation_gain_m > 0 && (
                <div className="flex items-center">
                  <TrendingUp className="h-3.5 w-3.5 mr-1" />
                  <span>{trip.total_elevation_gain_m}m</span>
                </div>
              )}
            </div>
          )}

          {/* Social stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Heart className={cn('h-3.5 w-3.5', trip.is_liked && 'fill-current text-red-500')} />
              <span>{trip.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{trip.comments_count || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
