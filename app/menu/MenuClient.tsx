'use client'

import React, { useMemo, useState } from 'react'
import { Search, Utensils, SlidersHorizontal, Leaf, IndianRupee, Star, Flame, Clock3, ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="space-y-7">
      <div className="rounded-[2rem] border border-zinc-800/80 bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 p-5 shadow-[0_25px_60px_-30px_rgba(252,211,77,0.75)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              <SlidersHorizontal className="h-4 w-4" />
              Advanced filters
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-zinc-50">Discover the chef's menu</h2>
              <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                Explore chef-curated dishes with smart filters and quick cart access.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label className="space-y-2 text-sm text-zinc-300">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <IndianRupee className="h-4 w-4 text-amber-400" />Price cap
              </span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/10"
              >
                <option value="all">All</option>
                <option value="500">₹500</option>
                <option value="600">₹600</option>
                <option value="700">₹700</option>
                <option value="800">₹800</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-zinc-300">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <Leaf className="h-4 w-4 text-emerald-400" />Dietary
              </span>
              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value)}
                className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/10"
              >
                {DIETARY_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
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
        <TabsList className="flex h-auto w-full max-w-full gap-2 overflow-x-auto rounded-3xl bg-zinc-900/90 p-2 shadow-sm shadow-black/10 no-scrollbar">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="shrink-0 rounded-2xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300 hover:bg-zinc-800"
            >
              {category}
            </TabsTrigger>
          ))}
          {/* Spacer to ensure the last category tab is fully visible */}
          <div className="w-6 shrink-0" />
        </TabsList>
      </Tabs>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No menu items matched your filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            const dietaryTags = getDietaryTags(item)
            const popularityLabel = item.name.toLowerCase().includes('truffle') || item.name.toLowerCase().includes('chef') ? "Chef's Choice" : 'Bestseller'
            const popularityIcon = popularityLabel === "Chef's Choice" ? Star : Flame

            return (
              <Card
                key={item.id}
                className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_80px_rgba(0,0,0,0.35)] hover:border-amber-400/30"
              >
                <div className="flex flex-col gap-5 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-[24px] font-bold tracking-tight text-zinc-50">{item.name}</CardTitle>
                      <p className="text-sm text-zinc-400">{item.category}</p>
                    </div>
                    <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] px-4 py-2 text-[22px] font-semibold text-zinc-950 shadow-[0_10px_28px_rgba(212,175,55,0.25)]">
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex flex-wrap gap-2">
                      {dietaryTags.map((tag) => {
                        const lower = tag.toLowerCase()
                        const icon = lower.includes('veg') ? Leaf : lower.includes('spicy') ? Flame : lower.includes('gluten') ? Clock3 : Star
                        const bg = lower.includes('vegan') ? 'bg-emerald-500/10 text-emerald-200' : lower.includes('veg') ? 'bg-amber-500/10 text-amber-200' : lower.includes('spicy') ? 'bg-rose-500/10 text-rose-200' : lower.includes('gluten') ? 'bg-slate-600/10 text-slate-200' : 'bg-zinc-900/80 text-zinc-100'

                        return (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${bg}`}
                          >
                            {React.createElement(icon, { className: 'h-3.5 w-3.5' })}
                            {tag}
                          </span>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                      <span className="inline-flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-2 text-zinc-200 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                        <Star className="h-4 w-4 text-amber-400" />
                        <span className="font-semibold text-zinc-50">4.8</span>
                        <span className="text-zinc-400">(124 Reviews)</span>
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden text-sm leading-7 text-zinc-400" style={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', display: '-webkit-box', overflow: 'hidden' }}>
                    {item.description || 'A beautifully composed plate with layered aromas and refined balance.'}
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
                    <span className="font-semibold text-zinc-50">{formatPrice(item.price)}</span>
                    <Button
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_18px_40px_rgba(251,191,36,0.35)] transition duration-300 ease-out hover:shadow-[0_24px_50px_rgba(251,191,36,0.45)] active:scale-[0.98]"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>

                  <div className="grid gap-3 rounded-[18px] border border-white/10 bg-zinc-950/80 p-4 text-sm text-zinc-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-amber-200">
                        <Clock3 className="h-4 w-4" />
                        <span>15 mins</span>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-amber-200">
                        {React.createElement(popularityIcon, { className: 'h-4 w-4' })}
                        {popularityLabel}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.26em] text-zinc-500">
                      <span className={item.is_available ? 'text-emerald-300' : 'text-rose-300'}>
                        {item.is_available ? '🟢 In Stock' : '🔴 Out of Stock'}
                      </span>
                      <span className="text-zinc-500">Premium service</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
