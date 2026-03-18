import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTrips } from '@/lib/db/queries'
import { TripCard } from '@/components/trips/TripCard'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { ActivityType } from '@/types'

const activityTypeOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'climbing', label: 'Climbing', emoji: '🧗' },
]

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Await searchParams in Next.js 15
  const params = await searchParams

  // Parse filters
  const filters: { activity_type?: ActivityType } = {}
  if (params.type) {
    filters.activity_type = params.type as ActivityType
  }

  const trips = await getTrips(50, 0, filters, user.id)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Trips</h1>
        </div>
        <Link href="/trips/create">
          <Button size="sm" className="rounded-full">
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/trips">
          <Button
            variant={!params.type ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
          >
            All
          </Button>
        </Link>
        {activityTypeOptions.map((option) => (
          <Link key={option.value} href={`/trips?type=${option.value}`}>
            <Button
              variant={params.type === option.value ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
            >
              {option.emoji} {option.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Trips Grid */}
      {trips.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No trips yet</h2>
          <p className="text-muted-foreground mb-6">
            Start documenting your outdoor adventures!
          </p>
          <Link href="/trips/create">
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} currentUserId={user.id} />
          ))}
        </div>
      )}
    </div>
  )
}
