import { createClient } from '@/lib/supabase/server'
import { leaveGroup } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/groups/[groupId]/leave - Leave a group
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

    const { error } = await leaveGroup(groupId, user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to leave group' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    )
  }
}
