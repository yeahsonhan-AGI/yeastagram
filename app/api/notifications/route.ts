import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, actorId, type, postId, commentId } = body

    // Don't create notification for yourself
    if (userId === actorId) {
      return NextResponse.json({ success: true, message: 'Skipping self-notification' })
    }

    const { data, error } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type,
        post_id: postId,
        comment_id: commentId,
      })
      .select()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
