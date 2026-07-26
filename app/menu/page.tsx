import { createServerClient } from '@supabase/ssr'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'
import { MenuItem } from '@/lib/types'
import { MenuClient } from './MenuClient'

export const revalidate = 60

async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL\!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY\!
  )

  const { data } = await supabase.from('menu_items').select('id, name, description, price, category, is_available, image_url, created_at')

  const formattedLuft: MenuItem[] = LUFT_MENU_ITEMS.map((item, idx) => ({
    id: `luft-${idx + 1}`,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    is_available: item.is_available,
  }))

  if (\!data || data.length === 0) {
    return formattedLuft
  }

  const mergedItems = [...formattedLuft]
  const existingNames = new Set(mergedItems.map((item) => item.name.toLowerCase()))

  ;(data as MenuItem[]).forEach((item) => {
    if (\!item?.name) return
    const normalizedName = item.name.toLowerCase()
    if (\!existingNames.has(normalizedName)) {
      mergedItems.push(item)
      existingNames.add(normalizedName)
    }
  })

  return mergedItems
}

export default async function MenuPage() {
  const menuItems = await fetchMenuItems()

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BreadcrumbNav items={[{ label: 'Home', href: '/' }, { label: 'Menu' }]} className="mb-3" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-zinc-950">M</span>
            Digital Menu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore our curated culinary creations and add items directly to your cart.
          </p>
        </div>
      </div>

      <MenuClient initialItems={menuItems} />
    </div>
  )
}
