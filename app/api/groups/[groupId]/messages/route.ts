import { createClient } from '@/lib/supabase/server'
import { getGroupMessages, createGroupMessage } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/messages - Get group messages
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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') || undefined

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view messages' },
        { status: 403 }
      )
    }

    const messages = await getGroupMessages(groupId, limit, before)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/messages - Send a message
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

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to send messages' },
        { status: 403 }
      )
    }

    const { data, error } = await createGroupMessage(groupId, user.id, body)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send message' },
        { status: 400 }
      )
    }

    return NextResponse.json({ message: data }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
