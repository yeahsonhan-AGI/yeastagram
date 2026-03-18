import { createClient } from '@/lib/supabase/server'
import { createGroupJoinRequest, getGroupJoinRequests } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/requests - Get pending join requests (leader only)
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

    const requests = await getGroupJoinRequests(groupId, user.id)

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching join requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch join requests' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/requests - Create a join request
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
    const { message } = body

    const { data, error } = await createGroupJoinRequest(groupId, user.id, message)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create join request' },
        { status: 400 }
      )
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating join request:', error)
    return NextResponse.json(
      { error: 'Failed to create join request' },
      { status: 500 }
    )
  }
}
