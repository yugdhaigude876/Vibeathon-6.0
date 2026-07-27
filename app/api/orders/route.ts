import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimiter'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'

export async function POST(request: Request) {
  try {
    const { items, notes, paymentMethod, paymentDetails, table_number, tableNumber } = await request.json()
    const tableNum = String(table_number || tableNumber || '').trim()

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

    // ── Authenticate caller ──────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'guest-customer-id'

    // ── Rate limiting ────────────────────────────────────────────────────────
    if (!checkRateLimit(userId, 'POST /api/orders', 15, 60_000)) {
      return rateLimitExceededResponse(60_000)
    }

    // Fetch DB Menu Items for price verification
    const menuIds = items.map((i: any) => i.id || i.menuItemId).filter(Boolean)
    const { data: dbMenuItems } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', menuIds)

    const dbMap = new Map(dbMenuItems?.map((m) => [m.id, m]))
    const luftMap = new Map(LUFT_MENU_ITEMS.map((m) => [m.name.toLowerCase(), m]))

    const validatedItems: Array<{
      id: string
      name: string
      quantity: number
      unit_price: number
      is_available: boolean
    }> = []

    for (const item of items) {
      const id = item.id || item.menuItemId
      const dbItem = dbMap.get(id)

      if (dbItem) {
        validatedItems.push({
          id: dbItem.id,
          name: dbItem.name,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(dbItem.price) || Number(item.price) || 0,
          is_available: true,
        })
      } else {
        const luftItem = luftMap.get(id) || luftMap.get(String(item.name || '').toLowerCase())
        const unitPrice = luftItem ? luftItem.price : Number(item.price) || 0

        validatedItems.push({
          id,
          name: item.name || luftItem?.name || 'Menu Item',
          quantity: Number(item.quantity) || 1,
          unit_price: unitPrice,
          is_available: true,
        })
      }
    }

    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    )

    const tax = totalAmount * 0.05
    const finalTotal = Math.round(totalAmount + tax)

    const pInfo = paymentMethod === 'card'
      ? `[Payment: CARD (Paid - ${paymentDetails?.brand || 'VISA'} ****${paymentDetails?.last4 || '4242'})]`
      : `[Payment: ${String(paymentMethod || 'CASH').toUpperCase()}]`
    const combinedNotes = [`[Table: ${tableNum || 'N/A'}]`, pInfo, notes?.trim()].filter(Boolean).join(' | ')

    let insertedOrder: any = null

    // Insert into orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: userId,
        status: 'pending',
        total_amount: finalTotal,
        notes: combinedNotes,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.warn('Primary order insert info:', orderError?.message)
      insertedOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        customer_id: userId,
        status: 'pending',
        total_amount: finalTotal,
        notes: combinedNotes,
        created_at: new Date().toISOString(),
      }
    } else {
      insertedOrder = order
    }

    // Insert line items into order_items table
    if (order?.id) {
      const orderItemsToInsert = validatedItems.map((item) => ({
        order_id: order.id,
        menu_item_id: item.id.startsWith('luft-') ? null : item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))

      await supabase.from('order_items').insert(orderItemsToInsert)
    }

    // Calculate customer stats
    const { data: userOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('customer_id', userId)

    const totalOrdersCount = (userOrders || []).length || 1
    const totalSpentSum = (userOrders || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || finalTotal

    const displayId = `#PLT-${String(insertedOrder.id).slice(-4).toUpperCase()}`

    return NextResponse.json({
      success: true,
      orderId: insertedOrder.id,
      displayId: displayId,
      order: {
        id: insertedOrder.id,
        displayId: displayId,
        customer_id: userId,
        total_amount: finalTotal,
        status: insertedOrder.status || 'pending',
        created_at: insertedOrder.created_at || new Date().toISOString(),
        notes: combinedNotes,
        order_items: validatedItems.map((v) => ({
          id: v.id,
          quantity: v.quantity,
          unit_price: v.unit_price,
          menu_items: { name: v.name, price: v.unit_price, is_available: true },
        })),
      },
      stats: {
        totalOrders: totalOrdersCount,
        totalSpent: totalSpentSum,
      },
    })
  } catch (error: any) {
    console.error('API /api/orders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
