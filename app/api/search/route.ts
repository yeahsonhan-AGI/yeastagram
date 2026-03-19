import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchUsers } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''

  if (!query.trim()) {
    return NextResponse.json([])
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const results = await searchUsers(query)

  // Check following status for current user
  let followingMap: Record<string, boolean> = {}
  if (user) {
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)

    followingMap = (follows || []).reduce((acc, f) => {
      acc[f.following_id] = true
      return acc
    }, {} as Record<string, boolean>)
  }

  // Add isFollowing to each result
  const resultsWithFollowStatus = results.map(profile => ({
    ...profile,
    isFollowing: followingMap[profile.id] || false,
  }))

  return NextResponse.json(resultsWithFollowStatus)
}
