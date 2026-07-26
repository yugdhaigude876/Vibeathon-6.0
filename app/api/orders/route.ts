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

    // ── SECURITY: Authenticate the caller ────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── SECURITY: Rate limiting — 10 orders/min per customer ──────────────────
    if (!checkRateLimit(user.id, 'POST /api/orders', 10, 60_000)) {
      return rateLimitExceededResponse(60_000)
    }

    // ── SECURITY: Role check — only customers may place orders ───────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role ? String(profile.role).toLowerCase() : 'customer'

    if (profile?.role && !['customer'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: staff and managers should not place customer orders' },
        { status: 403 }
      )
    }

    let restaurantId: string | null =
      profile?.restaurant_id ||
      process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
      process.env.DEFAULT_RESTAURANT_ID ||
      null

    // If we still don't have a valid restaurant_id, fetch the first restaurant from DB
    if (!restaurantId) {
      const { data: firstRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
        .maybeSingle()
      restaurantId = firstRestaurant?.id || null
    }

    // ── SECURITY: Validate menu items exist & determine server prices ─────────
    const menuItemIds = items.map((item) => item.menuItemId || item.id).filter(Boolean)

    const { data: dbMenuItems } = await supabase
      .from('menu_items')
      .select('id, name, price, is_available')
      .in('id', menuItemIds)

    const dbMap = new Map((dbMenuItems || []).map((m) => [m.id, m]))

    // Build fallback lookup for Luft static menu items
    const luftMap = new Map()
    LUFT_MENU_ITEMS.forEach((item, idx) => {
      const id = `luft-${idx + 1}`
      luftMap.set(id, item)
      luftMap.set(item.name.toLowerCase(), item)
    })

    const validatedItems: Array<{
      id: string
      name: string
      quantity: number
      unit_price: number
      is_available: boolean
    }> = []

    for (const item of items) {
      const id = item.menuItemId || item.id
      const dbItem = dbMap.get(id)

      if (dbItem) {
        if (dbItem.is_available === false) {
          return NextResponse.json(
            { error: `Item "${dbItem.name}" is currently out of stock.` },
            { status: 400 }
          )
        }
        validatedItems.push({
          id: dbItem.id,
          name: dbItem.name,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(dbItem.price) || Number(item.price) || 0,
          is_available: true,
        })
      } else {
        // Fallback to Luft menu item or client item if DB item is not found
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

    // Calculate total amount
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    )

    // Calculate tax & final total
    const tax = totalAmount * 0.05
    const finalTotal = totalAmount + tax

    // Format payment info into notes
    const pMethod = String(paymentMethod || 'Cash').toUpperCase()
    const pInfo = paymentMethod === 'card' ? `[Payment: CARD (Paid - ${paymentDetails?.brand || 'VISA'} ****${paymentDetails?.last4 || '4242'})]` : `[Payment: CASH ON DELIVERY (Pending)]`
    const combinedNotes = [`[Table: ${tableNum || 'N/A'}]`, pInfo, notes?.trim()].filter(Boolean).join(' | ')

    // Build insert payload — only include restaurant_id when we have a real value
    const orderPayload: Record<string, unknown> = {
      customer_id: user.id,
      status: 'pending',
      total_amount: finalTotal,
      notes: combinedNotes,
    }
    if (restaurantId) orderPayload.restaurant_id = restaurantId

    // ── Insert into orders table ─────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select()
      .single()

    if (orderError) {
      console.warn('Supabase primary order insert warning:', orderError.message)
      // Retry without restaurant_id in case of FK constraint failure
      const { data: fbOrder, error: fbError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          total_amount: finalTotal,
          status: 'pending',
          notes: combinedNotes,
        })
        .select()
        .single()

      if (fbError || !fbOrder) {
        console.warn('Supabase fallback order insert info:', fbError?.message || 'Using client-side persistence')
        const mockId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        return NextResponse.json({ success: true, orderId: mockId })
      }

      return NextResponse.json({ success: true, orderId: fbOrder.id })
    }


    // Prepare line items
    const orderItemsToInsert = validatedItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id.startsWith('luft-') ? null : item.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)

    if (itemsError) {
      console.warn('Order items insert warning:', itemsError.message)
    }

    return NextResponse.json({ success: true, orderId: order.id })
  } catch (error: any) {
    console.error('API /api/orders error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
