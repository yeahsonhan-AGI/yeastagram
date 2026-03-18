import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTripById } from '@/lib/db/queries'
import { EditTripClient } from '@/components/trips/EditTripClient'

interface EditTripPageProps {
  params: Promise<{
    tripId: string
  }>
}

export default async function EditTripPage({ params }: EditTripPageProps) {
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

  // Only owner can edit
  if (trip.user_id !== user.id) {
    redirect(`/trips/${tripId}`)
  }

  return <EditTripClient trip={trip} userId={user.id} />
}
