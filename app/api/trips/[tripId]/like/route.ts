import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { likeTrip, unlikeTrip, getTripById } from '@/lib/db/queries'

// POST /api/trips/[tripId]/like - Toggle like on a trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tripId } = await params
    // Check if trip exists and is accessible
    const trip = await getTripById(tripId, user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Don't allow liking private trips (unless owner)
    if (!trip.is_public && trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Cannot like private trip' }, { status: 403 })
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('trip_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('trip_id', tripId)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await unlikeTrip(tripId, user.id)
      if (error) throw error
      return NextResponse.json({ success: true, liked: false })
    } else {
      // Like
      const { error } = await likeTrip(tripId, user.id)
      if (error) throw error
      return NextResponse.json({ success: true, liked: true })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
