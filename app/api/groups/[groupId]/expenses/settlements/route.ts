import { createClient } from '@/lib/supabase/server'
import { calculateGroupExpenseSettlements } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/expenses/settlements - Get expense settlements
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

    // Check if user is a member
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to view settlements' },
        { status: 403 }
      )
    }

    const settlements = await calculateGroupExpenseSettlements(groupId)

    return NextResponse.json({ settlements })
  } catch (error) {
    console.error('Error calculating settlements:', error)
    return NextResponse.json(
      { error: 'Failed to calculate settlements' },
      { status: 500 }
    )
  }
}
