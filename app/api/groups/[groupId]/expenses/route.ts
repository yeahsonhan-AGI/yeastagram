import { createClient } from '@/lib/supabase/server'
import { getGroupExpenses, createGroupExpense, updateGroupExpense, deleteGroupExpense } from '@/lib/db/queries'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/groups/[groupId]/expenses - Get group expenses
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
        { error: 'You must be a member to view expenses' },
        { status: 403 }
      )
    }

    const expenses = await getGroupExpenses(groupId)

    console.log('GET /api/groups/[groupId]/expenses - groupId:', groupId)
    console.log('Fetched expenses:', JSON.stringify(expenses, null, 2))

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

// POST /api/groups/[groupId]/expenses - Create expense
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

    console.log('Creating expense with data:', { groupId, ...body })

    // Add default currency for backward compatibility
    const expenseData = {
      ...body,
      currency: body.currency || 'CNY',
    }

    if (!body.name || !body.amount || !body.expense_date) {
      console.error('Missing required fields:', { name: body.name, amount: body.amount, expense_date: body.expense_date })
      return NextResponse.json(
        { error: 'name, amount, and expense_date are required' },
        { status: 400 }
      )
    }

    // Check if user is the leader first
    const { data: group } = await supabase
      .from('groups')
      .select('leader_id')
      .eq('id', groupId)
      .single()

    const isLeader = group?.leader_id === user.id

    // If not leader, check if user is a member
    let isMember = isLeader
    if (!isLeader) {
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .maybeSingle()
      isMember = !!membership
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to add expenses' },
        { status: 403 }
      )
    }

    const { data, error } = await createGroupExpense(groupId, user.id, expenseData)

    if (error) {
      console.error('Supabase error creating expense:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message || 'Failed to create expense', details: error },
        { status: 400 }
      )
    }

    console.log('Expense created successfully:', JSON.stringify(data, null, 2))

    return NextResponse.json({ expense: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}

// PATCH /api/groups/[groupId]/expenses - Update expense
export async function PATCH(
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

    if (!body.expenseId) {
      return NextResponse.json(
        { error: 'expenseId is required' },
        { status: 400 }
      )
    }

    const { data, error } = await updateGroupExpense(body.expenseId, user.id, body)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update expense' },
        { status: 400 }
      )
    }

    return NextResponse.json({ expense: data })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId]/expenses - Delete expense
export async function DELETE(
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
    const expenseId = searchParams.get('expenseId')

    if (!expenseId) {
      return NextResponse.json(
        { error: 'expenseId is required' },
        { status: 400 }
      )
    }

    const { error } = await deleteGroupExpense(expenseId, user.id)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to delete expense' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    )
  }
}
