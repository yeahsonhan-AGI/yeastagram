import { createClient } from '@/lib/supabase/server'
import { joinGroup } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/groups/[groupId]/join - Join a group
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

    const { data, error } = await joinGroup(groupId, user.id)

    if (error) {
      // Check if this is a needsRequest or needsInvite error
      if (error.needsRequest || error.needsInvite) {
        return NextResponse.json(
          {
            error: error.message,
            needsRequest: error.needsRequest,
            needsInvite: error.needsInvite
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || 'Failed to join group' },
        { status: 400 }
      )
    }

    return NextResponse.json({ member: data }, { status: 201 })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    )
  }
}
