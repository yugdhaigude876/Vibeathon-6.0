'use client'

import React, { useMemo, useState } from 'react'
import { Search, ShoppingBag, Utensils, SlidersHorizontal, Leaf, IndianRupee } from 'lucide-react'
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
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
            >
              <option value="all">All</option>
              <option value="500">₹500</option>
              <option value="600">₹600</option>
              <option value="700">₹700</option>
              <option value="800">₹800</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-zinc-300">
            <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-emerald-400" />Dietary</span>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100"
            >
              {DIETARY_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search items or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500"
        />
      </div>

      <Tabs defaultValue="All" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="flex w-full justify-start overflow-x-auto no-scrollbar gap-2 rounded-2xl bg-zinc-900/90 p-2 border border-zinc-800">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="shrink-0 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
            No menu items matched your filters.
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="rounded-3xl border border-zinc-800 bg-zinc-950/90">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-semibold text-zinc-100">{item.name}</CardTitle>
                    <p className="text-xs text-zinc-400">{item.category}</p>
                  </div>
                  <Badge className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-zinc-950">
                    {formatPrice(item.price)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-zinc-400">{item.description || 'A royal specialty from our menu.'}</p>
                <div className="flex items-center justify-between gap-4">
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                  >
                    {item.is_available ? 'Add to Cart' : 'Unavailable'}
                  </Button>
                  <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {getDietaryTags(item).join(', ')}
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
