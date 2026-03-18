'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Trip } from '@/types'
import { MapPin, Calendar, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileTripsGridProps {
  trips: Trip[]
}

export function ProfileTripsGrid({ trips }: ProfileTripsGridProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-20 px-4 space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
            <MapPin className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">No trips yet</p>
          <p className="text-sm text-muted-foreground">Start documenting your adventures</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-2">
      {trips.map((trip) => {
        const coverPhoto = trip.cover_photo_url || trip.daily_logs?.[0]?.photos?.[0]

        return (
          <Link
            key={trip.id}
            href={`/trips/${trip.id}`}
            className="group touch-manipulation"
          >
            <div className="rounded-xl overflow-hidden bg-card shadow-sm border">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {coverPhoto ? (
                  <Image
                    src={coverPhoto}
                    alt={trip.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <MapPin className="h-10 w-10 sm:h-12 sm:w-12" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/70 rounded-full px-2 py-1 text-xs font-medium">
                  {trip.activity_type === 'hiking' ? 'Hiking' : 'Climbing'}
                </div>
                {trip.likes_count > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-black/70 rounded-full px-2 py-1 text-xs">
                    <Heart className={cn('h-3 w-3', trip.is_liked && 'fill-current text-red-500')} />
                    <span>{trip.likes_count}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 sm:p-2 space-y-1">
                <h3 className="font-medium text-sm line-clamp-1">{trip.name}</h3>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {trip.duration_type === 'single'
                      ? formatDate(trip.start_date)
                      : `${formatDate(trip.start_date)} - ${formatDate(trip.end_date!)}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
