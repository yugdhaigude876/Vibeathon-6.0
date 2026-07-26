'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Utensils,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  Tag,
  Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useRealtimeMenuItems } from '@/lib/supabaseHooks'
import { useToast } from '@/hooks/use-toast'
import { LUFT_MENU_ITEMS } from '@/lib/luftMenuData'
import { formatINR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  category?: string | null
  is_available?: boolean | null
  stock_level?: number | null
}

export default function StaffMenuPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['staff', 'manager'])

  const [realtimeItems, itemsLoading] = useRealtimeMenuItems()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toLocaleTimeString())
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Merge real-time items with Luft menu defaults if database returns empty
  const menuItems: MenuItem[] = useMemo(() => {
    if (realtimeItems && realtimeItems.length > 0) {
      return realtimeItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price || 0),
        category: item.category || 'General',
        is_available: item.is_available ?? true,
        stock_level: (item as any).stock_level ?? 25,
      }))
    }

    return LUFT_MENU_ITEMS.map((item, idx) => ({
      id: `luft-${idx + 1}`,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      is_available: item.is_available,
      stock_level: 20,
    }))
  }, [realtimeItems])

  const categories = useMemo(() => {
    const set = new Set(menuItems.map((i) => i.category || 'General'))
    return ['All', ...Array.from(set)]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (item.category || '').toLowerCase() === selectedCategory.toLowerCase()
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      setTogglingId(item.id)
      const nextValue = !item.is_available

      // If item is a Luft fallback item, insert or handle in Supabase
      if (item.id.startsWith('luft-')) {
        const { data: inserted, error: insertErr } = await supabase
          .from('menu_items')
          .insert({
            name: item.name,
            description: item.description || null,
            price: item.price,
            category: item.category || 'General',
            is_available: nextValue,
          })
          .select()
          .single()

        if (insertErr) {
          console.warn('Insert fallback item notice:', insertErr.message)
        }
      } else {
        const { error } = await supabase
          .from('menu_items')
          .update({ is_available: nextValue })
          .eq('id', item.id)

        if (error) throw error
      }

      setLastUpdated(new Date().toLocaleTimeString())
      toast({
        title: nextValue ? 'Dish Marked AVAILABLE 🟢' : 'Dish Marked 86\'d / UNAVAILABLE 🔴',
        description: `"${item.name}" availability updated.`,
      })
    } catch (err: any) {
      toast({
        title: 'Update Error',
        description: err.message || 'Failed to toggle availability.',
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleBulkReset = async (available: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: available })
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (error) throw error

      setLastUpdated(new Date().toLocaleTimeString())
      toast({
        title: available ? 'All Menu Items Reset to AVAILABLE' : 'All Items Marked UNAVAILABLE',
        description: 'Menu availability updated across the system.',
      })
    } catch (err: any) {
      toast({
        title: 'Bulk Update Error',
        description: err.message || 'Failed to update items.',
        variant: 'destructive',
      })
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Menu Management...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <Utensils className="h-7 w-7 text-amber-500" />
            Menu 86 & Availability Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-zinc-500" />
            Last updated: <span className="font-mono text-amber-300 font-semibold">{lastUpdated}</span>
            <span>•</span>
            <span>{menuItems.filter((i) => i.is_available).length} Available</span>
            <span>•</span>
            <span className="text-red-400 font-semibold">{menuItems.filter((i) => !i.is_available).length} 86'd</span>
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            className="border-red-500/40 text-red-300 hover:bg-red-950/30 text-xs"
          >
            <XCircle className="h-4 w-4 mr-1 text-red-400" />
            Mark Category 86'd
          </Button>

          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <DialogHeader>
                <DialogTitle>Mark All Items Unavailable?</DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  This will set all items in the database to out of stock. Customers will see them as unavailable.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="bg-zinc-800 border-zinc-700">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleBulkReset(false)
                    setIsConfirmOpen(false)
                  }}
                  className="bg-red-600 hover:bg-red-500"
                >
                  Confirm 86 All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => handleBulkReset(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Reset All Available
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid gap-4 md:grid-cols-3 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search dish or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-amber-500"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <span className="text-xs text-zinc-400 shrink-0 font-medium">Categories:</span>
          {categories.map((cat) => (
            <Badge
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cursor-pointer px-3 py-1 text-xs shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => {
          const isAvailable = item.is_available ?? true
          const stock = item.stock_level ?? 20
          const stockBadgeColor =
            stock <= 0 ? 'bg-red-500/20 text-red-400 border-red-500/40' : stock < 10 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'

          return (
            <Card
              key={item.id}
              className={`border transition-all flex flex-col justify-between ${
                isAvailable
                  ? 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                  : 'border-red-900/40 bg-red-950/10 opacity-75'
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-zinc-100 leading-snug">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-400">
                        <Tag className="h-2.5 w-2.5 mr-1 text-amber-400" />
                        {item.category || 'General'}
                      </Badge>
                      <span className="text-sm font-bold text-amber-400">
                        {formatINR(item.price)}
                      </span>
                    </div>
                  </div>

                  <Badge className={`text-[10px] ${stockBadgeColor}`}>
                    {stock <= 0 ? 'Out of Stock' : `${stock} in stock`}
                  </Badge>
                </div>

                {item.description && (
                  <CardDescription className="text-xs text-zinc-400 line-clamp-2 mt-2">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-between rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isAvailable ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-zinc-200">
                      {isAvailable ? 'Available' : 'Unavailable (86\'d)'}
                    </span>
                  </div>

                  {/* 44px Big Toggle Switch */}
                  <div className="flex items-center gap-2">
                    {togglingId === item.id && <Loader2 className="h-4 w-4 animate-spin text-amber-400" />}
                    <Switch
                      checked={isAvailable}
                      onCheckedChange={() => handleToggleAvailability(item)}
                      disabled={togglingId === item.id}
                      className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-700 h-6 w-11"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
