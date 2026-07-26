import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'

export const runtime = 'nodejs'

interface AssistantPayload {
  prompt: string
  context: 'customer' | 'manager'
}

function buildFallbackResponse(context: AssistantPayload['context'], prompt: string, data: { managerSummary: string }) {
  if (context === 'manager') {
    return `📊 **Operational Summary & Manager Pacing**:\n• Peak floor activity anticipated during evening service.\n• Kitchen stations operational.\n• Floor Status:\n${data.managerSummary || 'Normal order volume.'}`
  }

  const query = (prompt || '').toLowerCase()
  let matches = LUFT_MENU_ITEMS.filter((i) => {
    const text = `${i.name} ${i.description || ''} ${i.category}`.toLowerCase()
    if (query.includes('veg') && !query.includes('non-veg')) return !text.includes('chicken') && !text.includes('mutton') && !text.includes('prawn') && !text.includes('fish')
    if (query.includes('non-veg') || query.includes('chicken') || query.includes('meat')) return text.includes('chicken') || text.includes('mutton') || text.includes('prawn') || text.includes('fish')
    if (query.includes('spicy')) return text.includes('chili') || text.includes('spicy') || text.includes('habanero') || text.includes('tacos')
    if (query.includes('sweet') || query.includes('dessert')) return i.category === 'Dessert'
    if (query.includes('drink') || query.includes('beverage') || query.includes('coffee') || query.includes('tea')) return i.category === 'Beverages'
    return true
  }).slice(0, 3)

  if (matches.length === 0) matches = LUFT_MENU_ITEMS.slice(0, 3)

  const itemsFormatted = matches
    .map((m) => `• **${m.name}** (₹${m.price}) — *${m.category}*\n  ${m.description || 'Royal signature dish'}`)
    .join('\n\n')

  return `✨ **Royal Culinary Concierge Recommendation**:\n\n${itemsFormatted}\n\nAll items listed are available on our menu. Enjoy your dining experience!`
}

export async function POST(request: Request) {
  let body: Partial<AssistantPayload>
  try {
    body = (await request.json()) as Partial<AssistantPayload>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  const prompt = body.prompt?.trim()
  const context = body.context ?? 'customer'

  if (!prompt || (context !== 'customer' && context !== 'manager')) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
  )

  let menuItems: Array<any> = []
  let inventoryItems: Array<any> = []
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

    menuItems = (menuData ?? []).filter((item: any) => item.is_available !== false)
    inventoryItems = inventoryData ?? []

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)

    const todaysOrders = (ordersData ?? []).filter((order: any) => {
      const createdAt = new Date(order.created_at)
      return createdAt >= start && createdAt <= now
    })

    const itemCounts = new Map<string, number>()
    todaysOrders.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const name = Array.isArray(item.menu_items) ? item.menu_items[0]?.name : item.menu_items?.name ?? 'Unknown item'
        itemCounts.set(name, (itemCounts.get(name) ?? 0) + (item.quantity ?? 1))
      })
    })

    const topSellers = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)

    const lowStock = inventoryItems
      .filter((item: any) => (item.stock_level ?? 0) <= (item.reorder_level ?? 0))
      .map((item: any) => {
        const itemName = Array.isArray(item.menu_items) ? item.menu_items[0]?.name : item.menu_items?.name ?? 'Item'
        return `${itemName} — stock ${item.stock_level ?? 0}`
      })

    ordersSummary = [
      `Today’s order count: ${todaysOrders.length}`,
      `Top sellers: ${topSellers.length ? topSellers.join(', ') : 'No sales yet'}`,
      `Low stock alerts: ${lowStock.length ? lowStock.join('; ') : 'None'}`,
    ].join('\n')
  } catch (error) {
    console.error('Assistant context fetch failed:', error)
  }

  // Ensure full Luft menu items are always present in the AI assistant context with dietary tags
  const fullMenuItemsList = LUFT_MENU_ITEMS.map((item) => {
    const isNonVeg = [
      'chicken', 'mutton', 'lamb', 'fish', 'prawn', 'shrimp', 'crab', 'seafood',
      'beef', 'pepperoni', 'meat', 'chili con carne', 'bacon', 'kebab', 'salmon',
      'squid', 'carne chicken', 'barba"cola"', 'mob pizza', 'kani', 'keftades'
    ].some((kw) => `${item.name} ${item.description || ''}`.toLowerCase().includes(kw))
    
    const tag = isNonVeg ? 'Non-Veg🔴' : 'Veg🟢'
    return `${item.name} — ₹${item.price} | Category: ${item.category} | ${tag} | Description: ${item.description || 'Signature dish'}`
  })

  const menuContext = Array.from(new Set(fullMenuItemsList)).join('\n')

  const managerContext = ordersSummary || 'No manager data available.'

  const systemContext = context === 'manager'
    ? `You are PLATR's restaurant manager assistant. Answer using the operational summary provided. Be extremely concise, crisp, and actionable. Limit responses to 2-3 bullet points or short paragraphs.\n\nOperational summary:\n${managerContext}`
    : `You are PLATR's official Gourmet Dining Concierge for "Luft Menu".

STRICT RULES & CONSTRAINTS:
1. ONLY recommend dishes that exist in the official menu listed below. NEVER invent or hallucinate items not present in the menu.
2. Prices are strictly in Indian Rupees (₹). Never use $ or other currency symbols.
3. Clearly state whether each recommended dish is Vegetarian (Veg🟢) or Non-Vegetarian (Non-Veg🔴).
4. Categories available: Soup, Salads, Chip N Dip, Signature Tapas, Tacos & Tostadas, Asian Tapas, Dimsum, Sushi, Pinchos, Indian Tapas, Charcoal Plates, Pizzaz Pizza, Grande Plates, Burrito Bowls, Paella & Risotto, Asian Bowls, Biryani, Mains, Sides, Dessert.
5. When a guest asks for suggestions based on mood, spice level, budget, or pairings, select 2-3 matching items directly from our menu and describe why they complement each other.
6. Maintain a warm, polite, and royal dining concierge tone. Keep answers concise and well-formatted with markdown bullets.

OFFICIAL LUFT MENU DATASET:
${menuContext}`

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      response: buildFallbackResponse(context, prompt, {
        managerSummary: managerContext,
      }),
    })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    
    let text = ''
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      const result = await model.generateContent(`${systemContext}\n\nUser question: ${prompt}`)
      text = await result.response.text()
    } catch (modelError: any) {
      console.warn('gemini-2.5-flash failed, trying gemini-1.5-flash:', modelError?.message || modelError)
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await fallbackModel.generateContent(`${systemContext}\n\nUser question: ${prompt}`)
      text = await result.response.text()
    }

    return NextResponse.json({ response: text })
  } catch (error: any) {
    console.error('Gemini API call failed:', error?.message || error)
    return NextResponse.json({
      response: buildFallbackResponse(context, prompt, {
        managerSummary: managerContext,
      }),
      debugError: String(error?.message || error)
    })
  }
}
