import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .eq('id', id)
      .maybeSingle()

    if (error || !order) {
      const { data: fallbackOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (!fallbackOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, order: fallbackOrder })
    }

    return NextResponse.json({ success: true, order })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch order details' },
      { status: 500 }
    )
  }
}
