import { createClient } from '@/lib/supabase/server'
import { getGroupSharedItinerary, getGroupItineraryDays, createGroupItineraryDay, updateGroupItineraryDay, deleteGroupItineraryDay } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/itinerary/days - Get itinerary days
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { groupId } = await params

    // Check if user is the leader first
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    const isLeader = group?.leader_id === user.id

    // If not leader, check if user is a member
    let isMember = isLeader
    if (!isLeader) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()
      isMember = !!membership
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to view the itinerary' },
        { status: 403 }
      )
    }

    const itinerary = await getGroupSharedItinerary(groupId)

    if (!itinerary) {
      return NextResponse.json(
        { error: 'Itinerary not found' },
        { status: 404 }
      )
    }

    const days = await getGroupItineraryDays(itinerary.id)

    return NextResponse.json({ days })
  } catch (error) {
    console.error('Error fetching itinerary days:', error)
    return NextResponse.json(
      { error: 'Failed to fetch itinerary days' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/itinerary/days - Create itinerary day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { groupId } = await params
    const body = await request.json()

    console.log('Creating itinerary day with data:', JSON.stringify(body, null, 2))

    if (!body.itineraryId || !body.day_number || !body.log_date) {
      console.error('Missing required fields:', { itineraryId: body.itineraryId, day_number: body.day_number, log_date: body.log_date })
      return NextResponse.json(
        { error: 'itineraryId, day_number, and log_date are required' },
        { status: 400 }
      )
    }

    // Check if user is the leader first
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    const isLeader = group?.leader_id === user.id

    // If not leader, check if user is a member
    let isMember = isLeader
    if (!isLeader) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()
      isMember = !!membership
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to add itinerary days' },
        { status: 403 }
      )
    }

    const { data, error } = await createGroupItineraryDay(
      body.itineraryId,
      user.id,
      body
    )

    if (error) {
      console.error('Supabase error creating itinerary day:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message || 'Failed to create itinerary day', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ day: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating itinerary day:', error)
    return NextResponse.json(
      { error: 'Failed to create itinerary day' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId]/itinerary/days - Update itinerary day
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { groupId } = await params
    const body = await request.json()

    if (!body.dayId) {
      return NextResponse.json(
        { error: 'dayId is required' },
        { status: 400 }
      )
    }

    // Check if user is the leader first
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    const isLeader = group?.leader_id === user.id

    // If not leader, check if user is a member
    let isMember = isLeader
    if (!isLeader) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()
      isMember = !!membership
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to update itinerary days' },
        { status: 403 }
      )
    }

    // Extract dayId and itineraryId from body, they shouldn't be in the update data
    const { dayId, itineraryId, ...updateData } = body as any

    const { data, error } = await updateGroupItineraryDay(dayId, updateData)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update itinerary day' },
        { status: 400 }
      )
    }

    return NextResponse.json({ day: data })
  } catch (error) {
    console.error('Error updating itinerary day:', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary day' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/itinerary/days - Delete itinerary day
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { groupId } = await params
    const { searchParams } = new URL(request.url)
    const dayId = searchParams.get('dayId')

    if (!dayId) {
      return NextResponse.json(
        { error: 'dayId is required' },
        { status: 400 }
      )
    }

    // Check if user is the leader first
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    const isLeader = group?.leader_id === user.id

    // If not leader, check if user is a member
    let isMember = isLeader
    if (!isLeader) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()
      isMember = !!membership
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to delete itinerary days' },
        { status: 403 }
      )
    }

    const { error } = await deleteGroupItineraryDay(dayId)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete itinerary day' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting itinerary day:', error)
    return NextResponse.json(
      { error: 'Failed to delete itinerary day' },
      { status: 500 }
    )
  }
}
