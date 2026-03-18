import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/invite/validate?code=xxx - Validate an invite code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // First, cleanup expired invites
    await supabase.rpc('cleanup_expired_invites')

    // Get invite with group info
    const { data: invite, error } = await supabase
      .from('group_invites')
      .select(`
        *,
        groups (
          id,
          name
        )
      `)
      .eq('code', code)
      .eq('status', 'active')
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite code', group: null },
        { status: 404 }
      )
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', group: null },
        { status: 400 }
      )
    }

    // Check if max uses reached
    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json(
        { error: 'Invite has reached maximum uses', group: null },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        code: invite.code,
        max_uses: invite.max_uses,
        used_count: invite.used_count,
        expires_at: invite.expires_at,
      },
      group: invite.groups,
    })
  } catch (error) {
    console.error('Error validating invite:', error)
    return NextResponse.json(
      { error: 'Failed to validate invite', group: null },
      { status: 500 }
    )
  }
}
