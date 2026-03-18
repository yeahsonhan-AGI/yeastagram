import { createClient } from '@/lib/supabase/server'
import { getGroupById, updateGroup, deleteGroup } from '@/lib/db/queries'
import type { GroupInput } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { groupId } = await params

    const group = await getGroupById(groupId, user?.id)

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId] - Update group
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
    const body = await request.json() as Partial<GroupInput>

    const { data, error } = await updateGroup(groupId, user.id, body)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update group' },
        { status: 400 }
      )
    }

    return NextResponse.json({ group: data })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId] - Delete group
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

    const { error } = await deleteGroup(groupId, user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete group' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
