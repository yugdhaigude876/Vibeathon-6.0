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

    // 1. Query Orders
    let ordersQuery = supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .order('created_at', { ascending: false })

    if (user) {
      ordersQuery = ordersQuery.eq('customer_id', user.id)
    } else {
      ordersQuery = ordersQuery.limit(20)
    }

    let { data: orders, error: ordersErr } = await ordersQuery

    if (ordersErr || !orders) {
      const { data: fbOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      orders = fbOrders || []
    }

    // 2. Query Reservations
    let resQuery = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })

    if (user) {
      resQuery = resQuery.eq('customer_id', user.id)
    } else {
      resQuery = resQuery.limit(10)
    }

    let { data: reservations } = await resQuery

    const totalOrders = (orders || []).length
    const totalSpent = (orders || []).reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0
    )

    const activeReservations = (reservations || []).filter(
      (r) => r.status?.toLowerCase() !== 'cancelled' && r.status?.toLowerCase() !== 'completed'
    ).length

    const recentOrders = (orders || []).slice(0, 5)

    return NextResponse.json({
      success: true,
      totalOrders,
      totalSpent,
      activeReservations,
      recentOrders,
      orders: orders || [],
      reservations: reservations || [],
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
