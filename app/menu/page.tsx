'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Minus, ShoppingBag, Utensils, AlertCircle, SlidersHorizontal, Leaf, CircleDollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'
import { useCart } from '@/context/CartContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'

export interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  category: string
  is_available: boolean
  image_url?: string | null
  created_at?: string
}

const DEFAULT_CATEGORIES = ['All', 'Main', 'Appetizer', 'Side', 'Beverage']
const DIETARY_OPTIONS = ['All', 'Veg', 'Non-Veg', 'Vegan', 'Gluten-Free']

function getDietaryTags(item: MenuItem): string[] {
  const name = item.name?.toLowerCase() || ''
  const desc = item.description?.toLowerCase() || ''
  const text = `${name} ${desc}`
  const tags: string[] = []

  if (text.includes('vegan')) tags.push('vegan')
  if (text.includes('gluten-free') || text.includes('gluten free')) tags.push('gluten-free')
  if (text.includes('veg') && !text.includes('non-veg')) tags.push('veg')
  if (text.includes('chicken') || text.includes('mutton') || text.includes('fish') || text.includes('prawn') || text.includes('meat') || text.includes('non-veg')) {
    tags.push('non-veg')
  }
  return tags
}

export default function MenuPage() {
  const supabase = createClient()
  const { cart, addToCart, removeFromCart, totalItems, subtotal, setIsOpen } = useCart()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [dietaryFilter, setDietaryFilter] = useState<string>('All')

  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)

      const formattedLuft: MenuItem[] = LUFT_MENU_ITEMS.map((item, idx) => ({
        id: `luft-${idx + 1}`,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        is_available: item.is_available,
      }))

      // Fetch database items if any exist and merge/override
      const { data } = await supabase.from('menu_items').select('*')
      if (data && data.length > 0) {
        // combine DB items and LUFT items, removing duplicates by name
        const dbNames = new Set(data.map((d: any) => d.name.toLowerCase()))
        const nonDuplicateLuft = formattedLuft.filter((l) => !dbNames.has(l.name.toLowerCase()))
        setMenuItems([...(data as MenuItem[]), ...nonDuplicateLuft])
      } else {
        setMenuItems(formattedLuft)
      }
    } catch (err: any) {
      console.error('Unexpected error fetching menu:', err)
      const formattedLuft: MenuItem[] = LUFT_MENU_ITEMS.map((item, idx) => ({
        id: `luft-${idx + 1}`,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        is_available: item.is_available,
      }))
      setMenuItems(formattedLuft)
    } finally {
      setLoading(false)
    }
  }

  // Real-time listener for Supabase 'menu_items' table
  useEffect(() => {
    fetchMenuItems()

    const channel = supabase
      .channel('realtime_menu_items')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as MenuItem
            setMenuItems((prev) => {
              if (prev.some((item) => item.id === newItem.id)) {
                return prev.map((item) => (item.id === newItem.id ? newItem : item))
              }
              return [...prev, newItem]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as MenuItem
            setMenuItems((prev) =>
              prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Partial<MenuItem>).id
            if (deletedId) {
              setMenuItems((prev) => prev.filter((item) => item.id !== deletedId))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getDietaryTags = (item: MenuItem) => {
    const text = `${item.name} ${item.description || ''}`.toLowerCase()
    const tags: string[] = []

    if (text.includes('vegan') || text.includes('plant') || text.includes('tofu') || text.includes('lentil')) {
      tags.push('vegan')
    }
    if (text.includes('vegetarian') || text.includes('veg') || text.includes('paneer') || text.includes('mushroom')) {
      tags.push('vegetarian')
    }
    if (text.includes('gluten-free') || text.includes('gluten free') || text.includes('rice') || text.includes('corn')) {
      tags.push('gluten-free')
    }
    if (text.includes('dairy-free') || text.includes('lactose-free') || text.includes('without cream') || text.includes('non dairy')) {
      tags.push('dairy-free')
    }

    return tags
  }

  // Dynamic category list combining default categories and database categories
  const categories = useMemo(() => {
    const fetchedCategories = Array.from(
      new Set(menuItems.map((item) => item.category).filter(Boolean))
    )
    return ['All', ...fetchedCategories]
  }, [menuItems])

  // Filter items by category, price, dietary tags, and real-time search query
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))

      const matchesPrice =
        priceRange === 'all' || Number(item.price || 0) <= Number(priceRange)

      const dietaryTags = getDietaryTags(item)
      const matchesDietary =
        dietaryFilter === 'All' ||
        dietaryTags.some((tag) => tag === dietaryFilter.toLowerCase())

      return matchesCategory && matchesSearch && matchesPrice && matchesDietary
    })
  }, [menuItems, selectedCategory, searchQuery, priceRange, dietaryFilter])

  return (
    <div className="space-y-6 pb-24">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BreadcrumbNav items={[{ label: 'Home', href: '/' }, { label: 'Menu' }]} className="mb-3" />
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 flex items-center gap-2">
            <Utensils className="h-7 w-7 text-amber-500" />
            Digital Menu
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore our curated culinary creations and add items directly to your cart.
          </p>
        </div>

        {/* Real-time search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search items or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-300">
          <SlidersHorizontal className="h-4 w-4" />
          Advanced filters
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-2 text-sm text-zinc-300">
            <span className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-amber-400" />Price up to</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="all">Any price</option>
              <option value="15">₹15</option>
              <option value="25">₹25</option>
              <option value="40">₹40</option>
              <option value="60">₹60</option>
            </select>
          </label>

          <label className="space-y-2 text-sm text-zinc-300">
            <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-400" />Dietary preference</span>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              {DIETARY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Sticky Category Filter Tabs */}
      <div className="sticky top-14 z-30 bg-zinc-950/90 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-zinc-800/80">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar bg-zinc-900/80 p-1 border border-zinc-800">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="capitalize text-xs sm:text-sm px-4 py-1.5 shrink-0 data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950 font-medium"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Error alert if Supabase request fails */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <div>
            <p className="font-semibold">Unable to sync menu items</p>
            <p className="text-xs text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-zinc-900 border-zinc-800">
              <div className="h-44 bg-zinc-800 rounded-t-xl" />
              <CardHeader className="space-y-2">
                <div className="h-4 w-2/3 bg-zinc-800 rounded" />
                <div className="h-3 w-1/3 bg-zinc-800 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 w-full bg-zinc-800 rounded" />
                <div className="h-3 w-4/5 bg-zinc-800 rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-16 bg-zinc-800 rounded" />
                  <div className="h-9 w-24 bg-zinc-800 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <Utensils className="h-12 w-12 text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-zinc-300">No menu items found</h3>
          <p className="text-sm text-zinc-500 max-w-md mt-1">
            {searchQuery
              ? `No items match "${searchQuery}" in ${selectedCategory} category.`
              : `There are currently no items available in the ${selectedCategory} category.`}
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        /* Responsive Grid: 1 col mobile, 2 col tablet, 3-4 col desktop */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            const cartQty = cart[item.id]?.quantity || 0
            const formattedPrice = `₹${Number(item.price || 0).toFixed(2)}`

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden transition-all duration-300 border hover:-translate-y-1 ${
                  !item.is_available
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-75'
                    : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:shadow-lg hover:shadow-amber-500/5'
                }`}
              >
                <div>
                  {/* Optional Item Image Header */}
                  {item.image_url ? (
                    <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={`h-full w-full object-cover transition-transform duration-300 hover:scale-105 ${
                          !item.is_available ? 'grayscale opacity-60' : ''
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-b border-zinc-800/80">
                      <Utensils className="h-8 w-8 text-zinc-700" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-bold text-zinc-100 leading-snug">
                        {item.name}
                      </CardTitle>
                      {/* Category Badge */}
                      <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wider font-semibold">
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    {/* Item Description */}
                    <p className="text-xs text-zinc-400 line-clamp-3 min-h-[2.5rem]">
                      {item.description || 'No description available for this item.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getDietaryTags(item).slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-amber-500/20 text-[10px] uppercase tracking-wide text-amber-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer with Price and Action Button */}
                <div className="p-6 pt-0 border-t border-zinc-800/60 mt-2">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-xs text-zinc-500 block">Price</span>
                      <span className="text-lg font-extrabold text-amber-400">
                        {formattedPrice}
                      </span>
                    </div>

                    {/* Status Badge & Cart Controls */}
                    {!item.is_available ? (
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="destructive" className="text-xs">
                          Unavailable
                        </Badge>
                        <Button
                          disabled
                          size="sm"
                          className="bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                        >
                          Unavailable
                        </Button>
                      </div>
                    ) : cartQty === 0 ? (
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                        className="bg-amber-600 text-zinc-950 font-semibold hover:bg-amber-500 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    ) : (
                      /* Quantity Selector (+/- buttons) */
                      <div className="flex items-center gap-2 rounded-lg bg-zinc-800 p-1 border border-zinc-700">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-7 w-7 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-md"
                        >
                          <Minus className="h-3.5 w-3.5" />
                          <span className="sr-only">Decrease quantity</span>
                        </Button>
                        <span className="w-5 text-center text-sm font-bold text-amber-400">
                          {cartQty}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addToCart(item)}
                          className="h-7 w-7 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-md"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="sr-only">Increase quantity</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between rounded-xl bg-amber-600 p-4 text-zinc-950 shadow-2xl shadow-amber-600/30 border border-amber-500">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950/20 text-zinc-950">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-amber-400">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-950/80">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'} in Cart
                </p>
                <p className="text-lg font-black">₹{(subtotal * 1.085).toFixed(2)}</p>
              </div>
            </div>

            <Button
              size="sm"
              className="bg-zinc-950 text-amber-400 hover:bg-zinc-900 font-bold px-4"
              onClick={() => setIsOpen(true)}
            >
              View Cart
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
