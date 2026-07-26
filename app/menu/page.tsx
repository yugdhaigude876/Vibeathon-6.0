import { createServerClient } from '@supabase/ssr'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'
import { MenuItem } from '@/lib/types'
import { MenuClient } from './MenuClient'

export const revalidate = 60

async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data } = await supabase
    .from('menu_items')
    .select('id, name, description, price, category, is_available, image_url, created_at')

  const formattedLuft: MenuItem[] = LUFT_MENU_ITEMS.map((item, idx) => ({
    id: `luft-${idx + 1}`,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    is_available: item.is_available,
  }))

  if (!data || data.length === 0) {
    return formattedLuft
  }

  const mergedItems = [...formattedLuft]
  const existingNames = new Set(mergedItems.map((item) => item.name.toLowerCase()))

  const oldSampleNames = ['burger', 'pizza margherita', 'caesar salad', 'fries', 'cola', 'espresso']

  ;(data as MenuItem[]).forEach((item) => {
    if (!item?.name) return
    const normalizedName = item.name.toLowerCase()
    if (!existingNames.has(normalizedName) && !oldSampleNames.includes(normalizedName)) {
      mergedItems.push(item)
      existingNames.add(normalizedName)
    }
  })

  return mergedItems
}

export default async function MenuPage() {
  const menuItems = await fetchMenuItems()

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'Digital Menu' }]} />
      <MenuClient initialMenuItems={menuItems} />
    </div>
  )
}
