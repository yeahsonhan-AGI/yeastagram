import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getTrips, createTrip, getUserTrips } from '@/lib/db/queries'
import type { TripInput, TripFilters } from '@/types'

// GET /api/trips - Get trips with optional filtering
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const filters: TripFilters = {}
    if (searchParams.get('activity_type')) {
      filters.activity_type = searchParams.get('activity_type') as any
    }
    if (searchParams.get('user_id')) {
      filters.user_id = searchParams.get('user_id')!
    }
    if (searchParams.get('date_from')) {
      filters.date_from = searchParams.get('date_from')!
    }
    if (searchParams.get('date_to')) {
      filters.date_to = searchParams.get('date_to')!
    }

    // Parse pagination
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if getting user's own trips
    if (filters.user_id === user.id) {
      const trips = await getUserTrips(user.id, user.id)
      return NextResponse.json({ trips })
    }

    const trips = await getTrips(limit, offset, filters, user.id)
    return NextResponse.json({ trips })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as TripInput

    // Validate required fields
    if (!body.name || !body.activity_type || !body.duration_type || !body.start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, activity_type, duration_type, start_date' },
        { status: 400 }
      )
    }

    // Validate date range for multi-day trips
    if (body.duration_type === 'multi' && !body.end_date) {
      return NextResponse.json(
        { error: 'Multi-day trips require an end_date' },
        { status: 400 }
      )
    }

    const { data, error } = await createTrip(user.id, body)

    if (error) {
      console.error('Error creating trip:', error)
      return NextResponse.json({ error: error.message || 'Failed to create trip' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating trip:', error)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}
