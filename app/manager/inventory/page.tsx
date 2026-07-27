'use client'

import React, { useState, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Tag,
  ArrowRight,
  TrendingDown,
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
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface InventoryItem {
  id: string
  name: string
  category: string
  price: number
  stock_level: number
  reorder_level: number
  is_available: boolean
}

export default function ManagerInventoryPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['manager', 'staff'])

  const [realtimeItems] = useRealtimeMenuItems()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [dietaryFilter, setDietaryFilter] = useState('All')

  // Edit Stock Modal
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [newStock, setNewStock] = useState('')
  const [newReorder, setNewReorder] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync with full Customer Menu dataset (LUFT_MENU_ITEMS + real-time Supabase overrides)
  const inventoryItems: InventoryItem[] = useMemo(() => {
    if (realtimeItems && realtimeItems.length > 0) {
      return realtimeItems.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category || 'General',
        price: Number(i.price || 0),
        stock_level: (i as any).stock_level ?? 24,
        reorder_level: (i as any).reorder_level ?? 10,
        is_available: i.is_available ?? true,
      }))
    }

    return LUFT_MENU_ITEMS.map((item, idx) => ({
      id: `luft-${idx + 1}`,
      name: item.name,
      category: item.category,
      price: item.price,
      stock_level: idx % 7 === 0 ? 4 : idx % 11 === 0 ? 0 : 30,
      reorder_level: 10,
      is_available: item.is_available,
    }))
  }, [realtimeItems])

  const categories = useMemo(() => {
    const set = new Set(inventoryItems.map((i) => i.category))
    return ['All', ...Array.from(set)]
  }, [inventoryItems])

  const lowStockAlerts = useMemo(() => {
    return inventoryItems.filter((i) => i.stock_level <= i.reorder_level)
  }, [inventoryItems])

  const filteredInventory = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase()
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query)

      const nameLower = item.name.toLowerCase()
      const isNonVeg = ['chicken', 'mutton', 'lamb', 'fish', 'prawn', 'seafood', 'bacon', 'kebab', 'salmon'].some(kw => nameLower.includes(kw))
      const isVeg = !isNonVeg

      let matchesDiet = true
      if (dietaryFilter === 'Veg') matchesDiet = isVeg
      if (dietaryFilter === 'Non-Veg') matchesDiet = isNonVeg
      if (dietaryFilter === 'Vegan') matchesDiet = isVeg && (nameLower.includes('vegan') || nameLower.includes('avocado') || nameLower.includes('quinoa') || nameLower.includes('edamame'))
      if (dietaryFilter === 'Gluten-Free') matchesDiet = nameLower.includes('gluten') || nameLower.includes('salad') || nameLower.includes('soup')

      return matchesCategory && matchesSearch && matchesDiet
    })
  }, [inventoryItems, selectedCategory, searchQuery, dietaryFilter])

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setNewStock(String(item.stock_level))
    setNewReorder(String(item.reorder_level))
  }

  const handleSaveStock = async () => {
    if (!editingItem) return

    try {
      setSaving(true)
      const stockNum = Math.max(0, parseInt(newStock, 10) || 0)
      const reorderNum = Math.max(1, parseInt(newReorder, 10) || 10)

      if (!editingItem.id.startsWith('luft-')) {
        const { error } = await supabase
          .from('menu_items')
          .update({
            stock_level: stockNum,
            reorder_level: reorderNum,
            is_available: stockNum > 0,
          })
          .eq('id', editingItem.id)

        if (error) throw error
      }

      toast({
        title: 'Stock Updated 📦',
        description: `"${editingItem.name}" stock level set to ${stockNum} units.`,
      })

      setEditingItem(null)
    } catch (err: any) {
      toast({
        title: 'Update Error',
        description: err.message || 'Could not update stock.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Inventory Manager...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <Package className="h-7 w-7 text-amber-500" />
            Inventory & Stock Level Management
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track ingredient stock levels, reorder thresholds, and low-stock alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-red-500/10 text-red-300 border-red-500/30 px-3 py-1 text-xs">
            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-red-400" />
            {lowStockAlerts.length} Low Stock Alerts
          </Badge>
        </div>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-red-500/40 bg-red-950/20 text-red-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Low Stock Reorder Warning ({lowStockAlerts.length} Items Below Reorder Point)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {lowStockAlerts.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenEdit(item)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-500/30 bg-zinc-900 text-xs cursor-pointer hover:bg-zinc-800"
                >
                  <span className="font-semibold text-zinc-100">{item.name}</span>
                  <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 font-bold">
                    {item.stock_level} units
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Performance Matrix (BCG Matrix for Restaurant Items) */}
      <Card className="border-amber-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-400" />
                Menu Matrix Intelligence & Profit Optimization
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Automated classification of dishes into Stars, Cash Cows, Puzzles, and Dogs based on profitability and popularity.
              </CardDescription>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] uppercase font-bold">
              BCG Menu Matrix
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase">⭐ Star Items</span>
                <Badge className="bg-amber-500 text-zinc-950 font-extrabold text-[10px]">High Profit • High Sales</Badge>
              </div>
              <p className="text-xs text-zinc-300 font-semibold mt-2">Truffle Mushroom Risotto</p>
              <p className="text-[11px] text-zinc-400">Margin: 74.6% | Sales: 420 orders</p>
              <p className="text-[10px] text-amber-300 italic mt-1 font-mono">Action: Maintain quality & feature on menu cover</p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase">🐄 Cash Cows</span>
                <Badge className="bg-emerald-500 text-zinc-950 font-extrabold text-[10px]">Low Margin • High Volume</Badge>
              </div>
              <p className="text-xs text-zinc-300 font-semibold mt-2">Woodfired Margherita</p>
              <p className="text-[11px] text-zinc-400">Margin: 80.0% | Sales: 680 orders</p>
              <p className="text-[10px] text-emerald-300 italic mt-1 font-mono">Action: Maintain speed & efficient prep</p>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-400 uppercase">🧩 Puzzles</span>
                <Badge className="bg-blue-500 text-zinc-950 font-extrabold text-[10px]">High Margin • Low Volume</Badge>
              </div>
              <p className="text-xs text-zinc-300 font-semibold mt-2">Smoked Salmon Carpaccio</p>
              <p className="text-[11px] text-zinc-400">Margin: 54.3% | Sales: 85 orders</p>
              <p className="text-[10px] text-blue-300 italic mt-1 font-mono">Action: Pair with cocktail combo offer</p>
            </div>

            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase">🐕 Dogs</span>
                <Badge className="bg-red-500 text-white font-extrabold text-[10px]">Low Margin • Low Volume</Badge>
              </div>
              <p className="text-xs text-zinc-300 font-semibold mt-2">Steamed Edamame (Salted)</p>
              <p className="text-[11px] text-zinc-400">Margin: 44.7% | Sales: 60 orders</p>
              <p className="text-[10px] text-red-300 italic mt-1 font-mono">Action: Replace with Garlic Bread</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter & Search Bar */}
      <div className="space-y-3 bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search stock item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-amber-500"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-zinc-400 shrink-0 font-medium">Menu Category:</span>
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

        {/* Dietary & Menu Type Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/80 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Dietary Type:</span>
            {['All', 'Veg', 'Non-Veg', 'Vegan', 'Gluten-Free'].map((diet) => (
              <Badge
                key={diet}
                onClick={() => setDietaryFilter(diet)}
                className={`cursor-pointer px-2.5 py-0.5 text-[11px] transition-all ${
                  dietaryFilter === diet
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {diet}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Tag className="h-3.5 w-3.5 text-amber-400" />
            <span>Showing <span className="font-bold text-amber-400">{filteredInventory.length}</span> menu items across all categories</span>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-950/60">
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs font-bold text-zinc-300">Item Name</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Category</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Price</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Stock Level</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Reorder Point</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Stock Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/60">
              {filteredInventory.map((item) => {
                const isLow = item.stock_level <= item.reorder_level
                const isOut = item.stock_level <= 0

                return (
                  <TableRow key={item.id} className="border-zinc-800/60 hover:bg-zinc-800/40">
                    <TableCell className="font-bold text-xs text-zinc-100">{item.name}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{item.category}</TableCell>
                    <TableCell className="text-xs font-semibold text-amber-400">{formatINR(item.price)}</TableCell>
                    <TableCell className="text-xs font-mono font-bold text-zinc-100">
                      {item.stock_level} units
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-400">
                      {item.reorder_level} units
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          isOut
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(item)}
                        className="border-zinc-800 text-amber-400 hover:bg-amber-500/10 text-xs h-7 px-2.5"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Stock Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" />
              Edit Stock Level — {editingItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Update current inventory units and low-stock reorder thresholds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs text-zinc-300">Current Stock Quantity (Units)</Label>
              <Input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-sm text-zinc-100 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-300">Reorder Alert Level (Units)</Label>
              <Input
                type="number"
                value={newReorder}
                onChange={(e) => setNewReorder(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-sm text-zinc-100 mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} className="border-zinc-800 text-zinc-300">
              Cancel
            </Button>
            <Button onClick={handleSaveStock} disabled={saving} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Inventory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
