import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTripById, updateTrip, deleteTrip } from '@/lib/db/queries'
import type { TripInput } from '@/types'

// GET /api/trips/[tripId] - Get a single trip
export async function GET(
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
    const trip = await getTripById(tripId, user.id)

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('Error fetching trip:', error)
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 })
  }
}

// PUT /api/trips/[tripId] - Update a trip
export async function PUT(
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
    const body = await request.json() as Partial<TripInput>

    const { data, error } = await updateTrip(tripId, user.id, body)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update trip' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating trip:', error)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId] - Delete a trip
export async function DELETE(
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
    const { error } = await deleteTrip(tripId, user.id)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete trip' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 })
  }
}
