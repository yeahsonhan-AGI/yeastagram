import { createClient } from '@/lib/supabase/server'
import { getGroupMemberLocations } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/members/location - Get all member locations
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

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view member locations' },
        { status: 403 }
      )
    }

    const members = await getGroupMemberLocations(groupId)

    console.log('getGroupMemberLocations result:', {
      groupId,
      membersCount: members.length,
      members: members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        username: m.user?.username,
        locationSharingEnabled: m.location_sharing_enabled,
        hasLocation: !!(m.last_location_lat && m.last_location_lng),
      }))
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching member locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member locations' },
      { status: 500 }
    )
  }
}
