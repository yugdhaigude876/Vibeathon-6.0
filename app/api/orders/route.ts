import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimiter'

export async function POST(request: Request) {
  try {
    const { items, notes } = await request.json()

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
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role ? String(profile.role).toLowerCase() : 'customer'

    if (!profileError && profile?.role && !['customer'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: staff and managers should not place customer orders' },
        { status: 403 }
      )
    }

    if (profileError) {
      return NextResponse.json({ error: 'Failed to load customer profile' }, { status: 500 })
    }

    const restaurantId =
      profile?.restaurant_id ||
      process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID ||
      process.env.DEFAULT_RESTAURANT_ID

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant not configured for your account. Please contact support.' },
        { status: 500 }
      )
    }

    // ── SECURITY: Validate menu items exist and verify prices ─────────────────
    const menuItemIds = items.map((item) => item.menuItemId || item.id).filter(Boolean)

    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, price, is_available')
      .in('id', menuItemIds)

    if (menuError) {
      return NextResponse.json({ error: 'Failed to validate menu items' }, { status: 500 })
    }

    if (!menuItems || menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items do not exist' },
        { status: 400 }
      )
    }

    // Build a lookup map for quick access
    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]))

    // Verify availability and enforce server-side prices (prevent price manipulation)
    for (const item of items) {
      const id = item.menuItemId || item.id
      const menuItem = menuItemMap.get(id)

      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${id} not found` }, { status: 400 })
      }

      if (menuItem.is_available === false) {
        return NextResponse.json(
          { error: `Menu item ${id} is currently unavailable` },
          { status: 400 }
        )
      }

      // Check price tolerance (allow minor floating-point variance but reject large differences)
      const requestedPrice = Number(item.price) || 0
      const actualPrice = Number(menuItem.price) || 0
      if (actualPrice > 0 && Math.abs(requestedPrice - actualPrice) > 0.01) {
        return NextResponse.json(
          { error: `Price mismatch for item ${id}. Possible price manipulation attempt.` },
          { status: 400 }
        )
      }
    }

    // ── SECURITY: Use server-side price to calculate total (not client-supplied) ─
    const totalAmount = items.reduce((sum, item) => {
      const id = item.menuItemId || item.id
      const serverPrice = Number(menuItemMap.get(id)?.price) || 0
      const qty = Number(item.quantity) || 1
      return sum + serverPrice * qty
    }, 0)

    // ── SECURITY: Always use auth.uid() as customer_id (never trust body) ──────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurantId,
        status: 'pending',
        total_amount: totalAmount,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Prepare line items using server-side prices
    const orderItemsToInsert = items.map((item) => {
      const id = item.menuItemId || item.id
      return {
        order_id: order.id,
        menu_item_id: id,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(menuItemMap.get(id)?.price) || 0,
      }
    })

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
