'use client'

import React, { useMemo, useState } from 'react'
import { Search, ShoppingBag, Utensils, SlidersHorizontal, Leaf, IndianRupee, Sparkles } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { MenuItem } from '@/lib/types'

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

  if (text.includes('gluten-free') || text.includes('gluten free')) {
    tags.push('gluten-free')
  }

  return tags
}

export function MenuClient({ initialItems }: { initialItems?: MenuItem[] }) {
  const { addToCart } = useCart()
  const { toast } = useToast()

  const [menuItems] = useState<MenuItem[]>(initialItems ?? [])
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [dietaryFilter, setDietaryFilter] = useState<string>('All')

  const categories = useMemo(() => {
    const fetchedCategories = Array.from(
      new Set(menuItems.map((item) => item.category).filter(Boolean))
    )
    return ['All', ...fetchedCategories]
  }, [menuItems])

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

      const matchesPrice = priceRange === 'all' || Number(item.price || 0) <= Number(priceRange)

      const tags = getDietaryTags(item)
      const matchesDietary =
        dietaryFilter === 'All' ||
        tags.some((t) => t.toLowerCase() === dietaryFilter.toLowerCase())

      return matchesCategory && matchesSearch && matchesPrice && matchesDietary
    })
  }, [menuItems, selectedCategory, searchQuery, priceRange, dietaryFilter])

  const handleAddToCart = (item: MenuItem) => {
    addToCart(item)
    toast({
      title: 'Added to cart',
      description: `${item.name} was added to your cart.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero & Filters Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/30 p-6 sm:p-8 shadow-xl shadow-amber-500/5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Gourmet Menu
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">
              Discover the Chef's Menu
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Explore chef-curated dishes with smart filters and quick cart access.
            </p>
          </div>

          {/* Inline Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Price Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2">
              <IndianRupee className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-400">Max:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-zinc-100">All Prices</option>
                <option value="500" className="bg-zinc-900 text-zinc-100">₹500</option>
                <option value="600" className="bg-zinc-900 text-zinc-100">₹600</option>
                <option value="700" className="bg-zinc-900 text-zinc-100">₹700</option>
                <option value="800" className="bg-zinc-900 text-zinc-100">₹800</option>
              </select>
            </div>

            {/* Dietary Filter */}
            <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2">
              <Leaf className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-zinc-400">Diet:</span>
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-zinc-100 focus:outline-none cursor-pointer"
              >
                {DIETARY_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-zinc-900 text-zinc-100">{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search items or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-3 rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 shadow-lg shadow-black/20"
          />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-4 text-sm text-zinc-400 shadow-sm shadow-black/10">
          <p className="font-semibold text-zinc-100">Menu summary</p>
          <p className="mt-2 text-xs leading-6">
            {filteredItems.length} {filteredItems.length === 1 ? 'dish' : 'dishes'} available for your current selection.
          </p>
          <div className="mt-4 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />Freshly sourced ingredients
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />Seasonal favourites and bold flavours
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="All" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="flex h-auto w-full max-w-full gap-2 overflow-x-auto rounded-3xl bg-zinc-900/90 p-3 shadow-sm shadow-black/10 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-950">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="shrink-0 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300 hover:bg-zinc-800"
            >
              {category}
            </TabsTrigger>
          ))}
          <div className="w-8 shrink-0" />
        </TabsList>
      </Tabs>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No menu items matched your filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950/90 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-amber-500">
              <CardHeader className="space-y-4 border-b border-zinc-800/70 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl font-semibold text-zinc-50">{item.name}</CardTitle>
                    <p className="text-sm text-zinc-400">{item.category}</p>
                  </div>
                  <div className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm shadow-amber-500/20">
                    {formatPrice(item.price)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getDietaryTags(item).map((tag) => (
                    <span key={tag} className="rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-0 pt-4">
                <p className="min-h-[4.5rem] text-sm leading-6 text-zinc-400">{item.description || 'A royal specialty from our menu.'}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    className="w-full bg-amber-600 text-zinc-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-zinc-800"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                  >
                    {item.is_available ? 'Add to Cart' : 'Unavailable'}
                  </Button>
                  <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {item.is_available ? 'In stock' : 'Out of stock'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
