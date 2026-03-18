import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateDailyLog, deleteDailyLog } from '@/lib/db/queries'
import type { DailyLogInput } from '@/types'

// PUT /api/trips/[tripId]/daily-logs/[dailyLogId] - Update a daily log
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; dailyLogId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dailyLogId } = await params
    const body = await request.json() as Partial<DailyLogInput>

    // Validate photos count (max 10)
    if (body.photos && body.photos.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed per daily log' },
        { status: 400 }
      )
    }

    const { data, error } = await updateDailyLog(dailyLogId, body)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update daily log' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating daily log:', error)
    return NextResponse.json({ error: 'Failed to update daily log' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/daily-logs/[dailyLogId] - Delete a daily log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; dailyLogId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dailyLogId } = await params
    const { error } = await deleteDailyLog(dailyLogId)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete daily log' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily log:', error)
    return NextResponse.json({ error: 'Failed to delete daily log' }, { status: 500 })
  }
}
