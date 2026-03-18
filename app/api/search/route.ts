import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchUsers } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || ''

  if (!query.trim()) {
    return NextResponse.json([])
  }

  const results = await searchUsers(query)
  return NextResponse.json(results)
}
