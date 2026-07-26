'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Minus, ShoppingBag, Utensils, AlertCircle, SlidersHorizontal, Leaf, IndianRupee } from 'lucide-react'
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

const DEFAULT_CATEGORIES = ['All', 'Main', 'Appetizer', 'Beverages', 'Side']
const DIETARY_OPTIONS = ['All', 'Veg', 'Non-Veg', 'Vegan', 'Gluten-Free']

function formatPrice(value: number | null | undefined) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function getDietaryTags(item: MenuItem): string[] {
  const name = item.name?.toLowerCase() || ''
  const desc = item.description?.toLowerCase() || ''
  const text = `${name} ${desc}`
  const tags: string[] = []

  const nonVegKeywords = [
    'chicken', 'mutton', 'lamb', 'fish', 'prawn', 'shrimp', 'crab', 'seafood',
    'beef', 'pepperoni', 'meat', 'chili con carne', 'bacon', 'kebab', 'salmon',
    'squid', 'carne chicken', 'barba"cola"', 'mob pizza', 'kani', 'keftades'
  ]

  const isNonVeg = nonVegKeywords.some((kw) => text.includes(kw))
  if (isNonVeg) {
    tags.push('non-veg')
  } else {
    tags.push('veg')
    // Vegan is a subset of veg — only mark vegan if item is vegetarian
    if (
      text.includes('vegan') ||
      text.includes('plant-based') ||
      (text.includes('avocado') && !text.includes('cream')) ||
      text.includes('edamame') ||
      text.includes('quinoa')
    ) {
      tags.push('vegan')
    }
  }

  // Gluten-free only when explicitly stated — broad keywords like 'rice'/'corn' cause false positives
  if (text.includes('gluten-free') || text.includes('gluten free')) {
    tags.push('gluten-free')
  }

  return tags
}

export default function MenuPage() {
  const supabase = createClient()
  const { cart, addToCart, removeFromCart, totalItems, subtotal, setIsOpen } = useCart()

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    return LUFT_MENU_ITEMS.map((item, idx) => ({
      id: `luft-${idx + 1}`,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      is_available: item.is_available,
    }))
  })
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

      const { data } = await supabase.from('menu_items').select('*')
      if (data && data.length > 0) {
        const mergedItems = [...formattedLuft]
        const existingNames = new Set(mergedItems.map((item) => item.name.toLowerCase()))

        // Exclude old sample items that are not part of Luft Ka Menu
        const oldSampleNames = ['burger', 'pizza margherita', 'caesar salad', 'fries', 'cola', 'espresso']

        ;(data as MenuItem[]).forEach((item) => {
          if (!item?.name) return
          const normalizedName = item.name.toLowerCase()
          if (!existingNames.has(normalizedName) && !oldSampleNames.includes(normalizedName)) {
            mergedItems.push(item)
            existingNames.add(normalizedName)
          }
        })

        setMenuItems(mergedItems)
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

      const tags = getDietaryTags(item)
      const matchesDietary =
        dietaryFilter === 'All' ||
        tags.some((t) => t.toLowerCase() === dietaryFilter.toLowerCase())

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
            <span className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-amber-400" />Price up to</span>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="all">Any price</option>
              <option value="300">Under ₹300</option>
              <option value="500">Under ₹500</option>
              <option value="700">Under ₹700</option>
              <option value="1000">Under ₹1,000</option>
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
            const formattedPrice = formatPrice(item.price)
            const tags = getDietaryTags(item)
            const isNonVeg = tags.includes('non-veg')

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden transition-all duration-300 border hover:-translate-y-1.5 ${
                  !item.is_available
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-75'
                    : 'border-zinc-800 bg-zinc-900/90 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Standard Indian Veg (Green Circle) / Non-Veg (Red Dot) Indicator */}
                    <div
                      className={`h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 ${
                        isNonVeg ? 'border-red-500' : 'border-emerald-500'
                      }`}
                      title={isNonVeg ? 'Non-Vegetarian' : 'Vegetarian'}
                    >
                      <div
                        className={`h-2 w-2 ${
                          isNonVeg ? 'bg-red-500 rounded-full' : 'bg-emerald-500 rounded-full'
                        }`}
                      />
                    </div>
                    {/* Category Badge */}
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wider font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {item.category}
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-bold text-zinc-100 leading-snug break-words">
                    {item.name}
                  </CardTitle>

                  {/* Item Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 min-h-[2.5rem]">
                    {item.description || 'No description available for this dish.'}
                  </p>

                  {/* Additional Badges (e.g. Vegan, Spicy) */}
                  {tags.filter(t => t !== 'veg' && t !== 'non-veg').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.filter(t => t !== 'veg' && t !== 'non-veg').map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-[10px] uppercase font-bold px-2 py-0.5 border-lime-500/40 text-lime-400 bg-lime-950/20"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer with Price and Action Button */}
                <div className="p-5 pt-0 border-t border-zinc-800/60 mt-auto">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium block">Price</span>
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
                <p className="text-lg font-black">{formatPrice(subtotal * 1.05)}</p>
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
