import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface AssistantPayload {
  prompt: string
  context: 'customer' | 'manager'
}

function buildFallbackResponse(context: AssistantPayload['context'], data: { menuItems: string; managerSummary: string }) {
  if (context === 'manager') {
    return `Manager insights summary:\n${data.managerSummary}\n\nSuggested action: review low-stock or slow-moving dishes and keep an eye on pacing during the next peak window.`
  }

  return `Here’s a customer-friendly recommendation prompt based on the current menu:\n${data.menuItems}\n\nTry a dish that fits the guest’s preferences and budget, and mention any dietary needs clearly.`
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AssistantPayload>
  const prompt = body.prompt?.trim()
  const context = body.context ?? 'customer'

  if (!prompt || (context !== 'customer' && context !== 'manager')) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  let menuItems: Array<{ name: string; price?: number | null; category?: string | null; is_available?: boolean | null; description?: string | null }> = []
  let inventoryItems: Array<{ stock_level?: number | null; reorder_level?: number | null; menu_items?: { name?: string | null } | null }> = []
  let ordersSummary = ''

  try {
    const [{ data: menuData }, { data: inventoryData }, { data: ordersData }] = await Promise.all([
      supabase.from('menu_items').select('name, price, category, is_available, description').order('name', { ascending: true }),
      supabase.from('inventory').select('stock_level, reorder_level, menu_items(name)').order('stock_level', { ascending: true }),
      supabase
        .from('orders')
        .select('created_at, status, total_amount, order_items(*, menu_items(name))')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    menuItems = (menuData ?? []).filter((item) => item.is_available !== false)
    inventoryItems = inventoryData ?? []

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const todaysOrders = (ordersData ?? []).filter((order) => {
      const createdAt = new Date(order.created_at)
      return createdAt >= start && createdAt <= now
    })

    const itemCounts = new Map<string, number>()
    todaysOrders.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const name = item.menu_items?.name ?? 'Unknown item'
        itemCounts.set(name, (itemCounts.get(name) ?? 0) + (item.quantity ?? 1))
      })
    })

    const topSellers = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)

    const lowStock = inventoryItems
      .filter((item) => (item.stock_level ?? 0) <= (item.reorder_level ?? 0))
      .map((item) => `${item.menu_items?.name ?? 'Item'} — stock ${item.stock_level ?? 0}`)

    ordersSummary = [
      `Today’s order count: ${todaysOrders.length}`,
      `Top sellers: ${topSellers.length ? topSellers.join(', ') : 'No sales yet'}`,
      `Low stock alerts: ${lowStock.length ? lowStock.join('; ') : 'None'}`,
    ].join('\n')
  } catch (error) {
    console.error('Assistant context fetch failed:', error)
  }

  const menuContext = menuItems
    .slice(0, 12)
    .map((item) => `${item.name} — $${Number(item.price ?? 0).toFixed(2)} | ${item.category ?? 'General'} | ${item.description ?? 'Available today'}`)
    .join('\n')

  const managerContext = ordersSummary || 'No manager data available.'

  const systemContext = context === 'manager'
    ? `You are a restaurant manager assistant. Use the provided operational summary to answer the user. Be concise, practical, and action-oriented. Recommend staffing or reorder actions when appropriate.\n\nOperational summary:\n${managerContext}`
    : `You are a restaurant customer assistant. Use the provided menu context to answer the user's question with relevant dish recommendations. Be warm, concise, and helpful. Mention price and dietary fit when relevant.\n\nAvailable menu:\n${menuContext || 'No active items available.'}`

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      response: buildFallbackResponse(context, {
        menuItems: menuContext || 'No active items available.',
        managerSummary: managerContext,
      }),
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent([
      {
        role: 'user',
        parts: [{ text: `${systemContext}\n\nUser question: ${prompt}` }],
      },
    ])

    const response = await result.response.text()
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Gemini request failed:', error)
    return NextResponse.json({
      response: buildFallbackResponse(context, {
        menuItems: menuContext || 'No active items available.',
        managerSummary: managerContext,
      }),
    })
  }
}
