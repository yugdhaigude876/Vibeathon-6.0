import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .order('created_at', { ascending: false })

    if (user) {
      query = query.eq('customer_id', user.id)
    } else {
      query = query.limit(20)
    }

    const { data: orders, error } = await query

    if (error) {
      // Fallback query without FK join in case order_items join schema fails
      const { data: fallbackOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      return NextResponse.json({
        success: true,
        orders: fallbackOrders || [],
      })
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch customer orders' },
      { status: 500 }
    )
  }
}
