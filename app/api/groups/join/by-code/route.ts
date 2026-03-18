import { createClient } from '@/lib/supabase/server'
import { useInvite } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/groups/join/by-code - Join a group using invite code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('No user found in request')
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: '邀请码不能为空' },
        { status: 400 }
      )
    }

    console.log('User', user.id, 'attempting to join with code', code)

    const { data, error } = await useInvite(code, user.id)

    if (error) {
      console.error('Use invite error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to join group' },
        { status: 400 }
      )
    }

    console.log('Successfully joined group', data?.group_id)
    return NextResponse.json({ member: data }, { status: 201 })
  } catch (error) {
    console.error('Error joining group by code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '加入失败，请稍后重试' },
      { status: 500 }
    )
  }
}
