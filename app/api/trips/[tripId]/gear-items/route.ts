import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGearItem, updateGearItem, deleteGearItem } from '@/lib/db/queries'
import type { GearItemInput } from '@/types'

// POST /api/trips/[tripId]/gear-items - Create a gear item
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
    await params  // tripId is not used but needed for type compatibility
    const body = await request.json() as GearItemInput & { categoryId: string }

    if (!body.name || !body.categoryId || body.weight_g <= 0) {
      return NextResponse.json(
        { error: 'Name, categoryId, and weight_g are required' },
        { status: 400 }
      )
    }

    const { data, error } = await createGearItem(body.categoryId, body)

    if (error) {
      console.error('Database error creating gear item:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create gear item', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating gear item:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create gear item', details: error },
      { status: 500 }
    )
  }
}

// PUT /api/trips/[tripId]/gear-items - Update a gear item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await params  // tripId is not used but needed for type compatibility
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const body = await request.json() as Partial<GearItemInput>

    const { data, error } = await updateGearItem(itemId, body)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update gear item' }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating gear item:', error)
    return NextResponse.json({ error: 'Failed to update gear item' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/gear-items - Delete a gear item
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
    await params  // tripId is not used but needed for type compatibility
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const { error } = await deleteGearItem(itemId)

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete gear item' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gear item:', error)
    return NextResponse.json({ error: 'Failed to delete gear item' }, { status: 500 })
  }
}
