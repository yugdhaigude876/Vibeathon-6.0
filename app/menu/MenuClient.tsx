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

      {/* Cohesive Search & Dish Count Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 sm:px-5 shadow-lg shadow-black/20">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search dish name, ingredient or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-zinc-950/80 border-zinc-800/80 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 rounded-xl focus-visible:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-xs font-semibold text-zinc-400">
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-bold">
            {filteredItems.length} {filteredItems.length === 1 ? 'Dish' : 'Dishes'} Available
          </Badge>
          <div className="hidden md:flex items-center gap-3 text-[11px] border-l border-zinc-800 pl-3">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Fresh Ingredients</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Seasonal Specials</span>
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No menu items matched your filters.
          </div>
        ) : (
          filteredItems.map((item) => {
            const tags = getDietaryTags(item)
            const isNonVeg = tags.includes('non-veg')

            return (
              <Card
                key={item.id}
                className={`flex flex-col justify-between overflow-hidden transition-all duration-300 border rounded-3xl ${
                  !item.is_available
                    ? 'border-zinc-800/60 bg-zinc-900/40 opacity-75'
                    : 'border-zinc-800/80 bg-zinc-950/90 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10'
                }`}
              >
                <div className="p-5 space-y-3">
                  {/* Top Bar: Veg/Non-Veg Dot + Category Badge + Price Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                      <Badge variant="secondary" className="shrink-0 text-[10px] uppercase tracking-wider font-semibold bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {item.category}
                      </Badge>
                    </div>

                    {/* Gold Price Pill */}
                    <Badge className="rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-zinc-950 shadow-sm shadow-amber-500/20">
                      {formatPrice(item.price)}
                    </Badge>
                  </div>

                  {/* Title on its own dedicated full line */}
                  <CardTitle className="text-base font-bold text-zinc-100 leading-snug break-words pt-1">
                    {item.name}
                  </CardTitle>

                  {/* Item Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 min-h-[2.5rem]">
                    {item.description || 'No description available for this dish.'}
                  </p>

                  {/* Dietary Pill Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                          tag === 'non-veg'
                            ? 'border-red-500/30 text-red-400 bg-red-950/20'
                            : tag === 'veg'
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                            : 'border-amber-500/30 text-amber-400 bg-amber-950/20'
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Card Footer with Full Width Add to Cart & Stock Status */}
                <div className="p-5 pt-0 mt-auto">
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/10"
                    >
                      {item.is_available ? 'Add to Cart' : 'Unavailable'}
                    </Button>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 shrink-0">
                      {item.is_available ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
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
