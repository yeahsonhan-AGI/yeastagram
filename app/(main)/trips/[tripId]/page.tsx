import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTripById } from '@/lib/db/queries'
import { TripDetail } from '@/components/trips/TripDetail'

interface TripPageProps {
  params: Promise<{
    tripId: string
  }>
}

export default async function TripPage({ params }: TripPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const { tripId } = await params
  const trip = await getTripById(tripId, user.id)

  if (!trip) {
    notFound()
  }

  return <TripDetail trip={trip} currentUserId={user.id} />
}
