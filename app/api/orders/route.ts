import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { items, restaurantId, notes } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid items array' }, { status: 400 })
    }

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const price = Number(item.price) || 0
      const qty = Number(item.quantity) || 1
      return sum + price * qty
    }, 0)

    // Insert into orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurantId || null,
        status: 'pending',
        total_amount: totalAmount,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Prepare line items
    const orderItemsToInsert = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId || item.id,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.price) || 0,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    if (itemsError) {
      // Clean up order since items failed to insert
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: any) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    }, { status: 500 })
  }
}
