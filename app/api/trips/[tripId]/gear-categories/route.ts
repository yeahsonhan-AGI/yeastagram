import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGearCategory, deleteGearCategory } from '@/lib/db/queries'
import type { GearCategoryInput } from '@/types'

// POST /api/trips/[tripId]/gear-categories - Create a gear category
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
    const body = await request.json() as GearCategoryInput

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await createGearCategory(tripId, body)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error creating gear category:', error)
    return NextResponse.json({ error: 'Failed to create gear category' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/gear-categories - Delete a gear category
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
    await params
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const { error } = await deleteGearCategory(categoryId)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gear category:', error)
    return NextResponse.json({ error: 'Failed to delete gear category' }, { status: 500 })
  }
}
