import { createClient } from '@/lib/supabase/server'
import { getGroups, createGroup, getUserGroups } from '@/lib/db/queries'
import type { GroupInput } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups - Get groups list
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const searchParams = request.nextUrl.searchParams
    const includeJoined = searchParams.get('include_joined') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const groups = await getGroups(
      limit,
      offset,
      user?.id,
      includeJoined
    )

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as Partial<GroupInput>

    // Validate required fields
    if (!body.name || !body.activity_type || !body.start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, activity_type, start_date' },
        { status: 400 }
      )
    }

    const groupData: GroupInput = {
      name: body.name,
      description: body.description,
      activity_type: body.activity_type,
      start_date: body.start_date,
      end_date: body.end_date,
      cover_photo_url: body.cover_photo_url,
      is_public: body.is_public ?? false,
      join_type: body.join_type ?? 'request',
      max_members: body.max_members ?? 10,
      trip_id: body.trip_id,
    }

    console.log('Creating group with data:', JSON.stringify(groupData, null, 2))
    const { data, error } = await createGroup(user.id, groupData)

    if (error) {
      console.error('Supabase error creating group:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        {
          error: error.message || 'Failed to create group',
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ group: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
