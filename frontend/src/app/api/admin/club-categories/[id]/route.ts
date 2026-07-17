import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { clubCategorySchema } from '@/lib/validations/clubs'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: categoryId } = params
    if (!categoryId) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })

    const { supabase } = auth
    
    const body = await request.json()
    const parsed = clubCategorySchema.parse(body)

    const { data, error } = await supabase
      .from('club_categories')
      .update({ name: parsed.name })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
      }
      console.error('Error updating club category:', error)
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }
    console.error('Error in PATCH /api/admin/club-categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: categoryId } = params
    if (!categoryId) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })

    const { supabase } = auth

    const { error } = await supabase
      .from('club_categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting club category:', error)
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/club-categories/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
