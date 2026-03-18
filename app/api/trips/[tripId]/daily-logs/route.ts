import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDailyLogs, createDailyLog, updateDailyLog, deleteDailyLog } from '@/lib/db/queries'
import type { DailyLogInput } from '@/types'

// GET /api/trips/[tripId]/daily-logs - Get all daily logs for a trip
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
    const dailyLogs = await getDailyLogs(tripId)
    return NextResponse.json({ daily_logs: dailyLogs })
  } catch (error) {
    console.error('Error fetching daily logs:', error)
    return NextResponse.json({ error: 'Failed to fetch daily logs' }, { status: 500 })
  }
}

// POST /api/trips/[tripId]/daily-logs - Create a new daily log
export async function POST(
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
    const body = await request.json() as DailyLogInput

    // Validate required fields
    if (body.day_number === undefined || !body.log_date) {
      return NextResponse.json(
        { error: 'Missing required fields: day_number, log_date' },
        { status: 400 }
      )
    }

    // Validate photos count (max 10)
    if (body.photos && body.photos.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 photos allowed per daily log' },
        { status: 400 }
      )
    }

    const { data, error } = await createDailyLog(tripId, body)

    if (error) {
      console.error('Database error creating daily log:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create daily log', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating daily log:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create daily log', details: error },
      { status: 500 }
    )
  }
}
