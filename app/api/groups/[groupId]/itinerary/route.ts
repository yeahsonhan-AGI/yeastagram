import { createClient } from '@/lib/supabase/server'
import { getGroupSharedItinerary, createGroupSharedItinerary, updateGroupSharedItinerary, getGroupMembers } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/itinerary - Get shared itinerary
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

    return NextResponse.json({ itinerary })
  } catch (error) {
    console.error('Error fetching itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch itinerary' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/itinerary - Create shared itinerary
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
    const { name, notes } = body

    console.log('Creating itinerary with data:', { groupId, name, notes })

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if user is the leader (bypass RLS by checking groups table directly)
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
        { error: 'You must be a member to create an itinerary' },
        { status: 403 }
      )
    }

    const { data, error } = await createGroupSharedItinerary(groupId, name, notes)

    if (error) {
      console.error('Supabase error creating itinerary:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message || 'Failed to create itinerary', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ itinerary: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to create itinerary' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId]/itinerary - Update shared itinerary
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
    const { itineraryId, name, notes } = body

    if (!itineraryId || !name) {
      return NextResponse.json(
        { error: 'itineraryId and name are required' },
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
        { error: 'You must be a member to update the itinerary' },
        { status: 403 }
      )
    }

    const { data, error } = await updateGroupSharedItinerary(itineraryId, name, notes)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update itinerary' },
        { status: 400 }
      )
    }

    return NextResponse.json({ itinerary: data })
  } catch (error) {
    console.error('Error updating itinerary:', error)
    return NextResponse.json(
      { error: 'Failed to update itinerary' },
      { status: 500 }
    )
  }
}
