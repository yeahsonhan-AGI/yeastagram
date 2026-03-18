import { createClient } from '@/lib/supabase/server'
import { createGroupInvite, getGroupInvites, revokeInvite } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/invites - Get all invites for a group
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

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden - not a group member' },
        { status: 403 }
      )
    }

    const invites = await getGroupInvites(groupId)

    return NextResponse.json({ invites })
  } catch (error) {
    console.error('Error getting group invites:', error)
    return NextResponse.json(
      { error: 'Failed to get invites' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/invites - Create a new invite
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

    // Verify user is the group leader
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    if (!group || group.leader_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - only group leader can create invites' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { maxUses = 10, expiresDays = 7 } = body

    const { data, error } = await createGroupInvite(
      groupId,
      user.id,
      maxUses,
      expiresDays
    )

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create invite' },
        { status: 400 }
      )
    }

    return NextResponse.json({ invite: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/invites - Revoke an invite
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
    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json(
        { error: 'inviteId is required' },
        { status: 400 }
      )
    }

    // Verify the invite belongs to this group
    const { data: invite } = await supabase
      .from('group_invites')
      .select('group_id')
      .eq('id', inviteId)
      .single()

    if (!invite || invite.group_id !== groupId) {
      return NextResponse.json(
        { error: 'Invite not found or does not belong to this group' },
        { status: 404 }
      )
    }

    const { error } = await revokeInvite(inviteId, user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to revoke invite' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking invite:', error)
    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    )
  }
}
