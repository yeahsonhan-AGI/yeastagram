import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTripById, createTripComment, getTripComments, deleteTripComment } from '@/lib/db/queries'

// GET /api/trips/[tripId]/comments - Get comments for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tripId } = await params
    // Check if trip exists and is accessible
    const trip = await getTripById(tripId, user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const comments = await getTripComments(tripId)
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST /api/trips/[tripId]/comments - Create a comment on a trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { tripId } = await params
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Content too long (max 1000 characters)' }, { status: 400 })
    }

    // Check if trip exists and is accessible
    const trip = await getTripById(tripId, user.id)
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Don't allow commenting on private trips (unless owner)
    if (!trip.is_public && trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Cannot comment on private trip' }, { status: 403 })
    }

    // Create comment
    const { data, error } = await createTripComment(tripId, user.id, content)

    if (error || !data) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message || 'Failed to create comment' }, { status: 500 })
    }

    // Fetch profile data separately
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Combine comment with profile
    const commentWithProfile = {
      ...data,
      profiles: profile || null
    }

    return NextResponse.json({ success: true, comment: commentWithProfile }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/comments - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await params  // params is not used but needs to be awaited for type compatibility
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    const { error } = await deleteTripComment(commentId, user.id)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete comment' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
