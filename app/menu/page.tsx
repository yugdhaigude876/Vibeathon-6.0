'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Search, Plus, Minus, ShoppingBag, Utensils, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export default function MenuPage() {
  const supabase = createClient()
  const { cart, addToCart, removeFromCart, totalItems, subtotal, setIsOpen } = useCart()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Fetch initial menu items from Supabase
  const fetchMenuItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) {
        console.error('Error fetching menu items:', fetchError)
        setError(fetchError.message)
      } else if (data) {
        setMenuItems(data as MenuItem[])
      }
    } catch (err: any) {
      console.error('Unexpected error fetching menu:', err)
      setError(err?.message || 'Failed to load menu items')
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
    const combined = ['All']
    DEFAULT_CATEGORIES.slice(1).forEach((cat) => {
      if (!combined.map((c) => c.toLowerCase()).includes(cat.toLowerCase())) {
        combined.push(cat)
      }
    })
    fetchedCategories.forEach((cat) => {
      if (!combined.map((c) => c.toLowerCase()).includes(cat.toLowerCase())) {
        combined.push(cat)
      }
    })
    return combined
  }, [menuItems])

  // Filter items by category and real-time search query
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

      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  return (
    <div className="relative z-10 space-y-6 pb-24">
      <div className="glass-panel overflow-hidden p-5 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
              <Utensils className="h-3.5 w-3.5" />
              Signature Dining
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              <span className="gold-gradient-text">Royal Menu</span>
            </h1>
            <p className="text-sm leading-6 text-zinc-400 sm:text-base">
              Discover curated dishes, seamless ordering, and a refined in-app dining experience designed for comfort and speed.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search dishes or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-white/10 bg-zinc-950/70 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-30 -mx-4 border-b border-white/10 bg-zinc-950/70 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto border border-white/10 bg-zinc-900/70 p-1 no-scrollbar">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="shrink-0 px-4 py-1.5 text-xs font-semibold capitalize text-zinc-400 sm:text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950"
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
                className={`group flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  !item.is_available
                    ? 'border border-white/10 bg-zinc-900/40 opacity-75'
                    : 'border border-white/10 bg-zinc-900/75 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-[0_20px_60px_rgba(245,158,11,0.12)]'
                }`}
              >
                <div>
                  {/* Optional Item Image Header */}
                  {item.image_url ? (
                    <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          !item.is_available ? 'grayscale opacity-60' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center border-b border-white/10 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950">
                      <Utensils className="h-8 w-8 text-amber-400/70" />
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-bold leading-snug text-zinc-100">
                        {item.name}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0 border border-amber-500/20 bg-amber-500/10 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <p className="min-h-[2.5rem] text-xs leading-5 text-zinc-400 line-clamp-3">
                      {item.description || 'No description available for this item.'}
                    </p>
                  </CardContent>
                </div>

                <div className="mt-2 border-t border-white/10 p-6 pt-4">
                  <div className="flex items-center justify-between">
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
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 font-semibold text-zinc-950 shadow-[0_8px_24px_rgba(245,158,11,0.25)] hover:brightness-110"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Cart
                      </Button>
                    ) : (
                      /* Quantity Selector (+/- buttons) */
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800/80 p-1">
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
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 sm:left-auto sm:right-8 sm:w-96">
          <div className="flex items-center justify-between rounded-[1.25rem] border border-amber-500/30 bg-gradient-to-r from-amber-500 to-yellow-500 p-4 text-zinc-950 shadow-[0_20px_80px_rgba(245,158,11,0.25)]">
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
                <p className="text-lg font-black">${(subtotal * 1.085).toFixed(2)}</p>
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
