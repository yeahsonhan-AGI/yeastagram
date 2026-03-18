import { createClient } from '@/lib/supabase/server'
import { respondToGroupJoinRequest } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/groups/[groupId]/requests/[requestId] - Respond to join request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; requestId: string }> }
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

    const { requestId } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const { error } = await respondToGroupJoinRequest(requestId, user.id, action)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to respond to join request' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error responding to join request:', error)
    return NextResponse.json(
      { error: 'Failed to respond to join request' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/requests/[requestId] - Cancel join request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; requestId: string }> }
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

    const { requestId } = await params

    // Delete the join request (only if it's from the current user and pending)
    const { error } = await supabase
      .from('group_join_requests')
      .delete()
      .eq('id', requestId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to cancel join request' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error canceling join request:', error)
    return NextResponse.json(
      { error: 'Failed to cancel join request' },
      { status: 500 }
    )
  }
}
