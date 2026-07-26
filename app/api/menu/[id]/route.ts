import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored when called from Server Component context
            }
          },
        },
      }
    )

    // Fetch the current item
    const { data: item, error: fetchError } = await supabase
      .from('menu_items')
      .select('is_available')
      .eq('id', id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: fetchError?.message || 'Item not found' }, { status: 404 })
    }

    // Toggle the availability
    const newAvailability = !item.is_available

    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update({ is_available: newAvailability })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error: any) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    }, { status: 500 })
  }
}
