import { createClient } from '@/lib/supabase/server'
import { updateGroupMemberLocation, toggleLocationSharing } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/groups/[groupId]/location - Update user's location
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
    const { latitude, longitude } = body

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Check if user is a member (any member can update their location)
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to update location' },
        { status: 403 }
      )
    }

    const { error } = await updateGroupMemberLocation(groupId, user.id, { latitude, longitude })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update location' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId]/location - Toggle location sharing
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
    const { enabled } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled is required (boolean)' },
        { status: 400 }
      )
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to toggle location sharing' },
        { status: 403 }
      )
    }

    const { error } = await toggleLocationSharing(groupId, user.id, enabled)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to toggle location sharing' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, enabled })
  } catch (error) {
    console.error('Error toggling location sharing:', error)
    return NextResponse.json(
      { error: 'Failed to toggle location sharing' },
      { status: 500 }
    )
  }
}
