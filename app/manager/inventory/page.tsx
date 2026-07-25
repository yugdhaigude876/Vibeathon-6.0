'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Minus, Package, PackageCheck, Plus, RefreshCw } from 'lucide-react'

import { createClient } from '@/lib/supabase'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InventoryItem {
  id: string
  stock_level: number
  reorder_level: number
  menu_items?: {
    id: string
    name?: string | null
    category?: string | null
    is_available?: boolean | null
  } | null
}

export default function InventoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [autoSync, setAutoSync] = useState(false)

  useEffect(() => {
    const loadInventory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/menu')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      const role = profileData?.role?.toLowerCase() ?? 'customer'

      if (role !== 'manager' && role !== 'staff') {
        router.replace('/menu')
        return
      }

      const { data } = await supabase
        .from('inventory')
        .select('*, menu_items(id, name, category, is_available)')
        .order('stock_level', { ascending: true })

      if (data) {
        setInventory(data as InventoryItem[])
      }

      setLoading(false)
    }

    void loadInventory()
  }, [router, supabase])

  const filteredInventory = useMemo(() => {
    const term = search.toLowerCase()
    return inventory.filter((item) => {
      const name = item.menu_items?.name?.toLowerCase() ?? ''
      const category = item.menu_items?.category?.toLowerCase() ?? ''
      return name.includes(term) || category.includes(term)
    })
  }, [inventory, search])

  const lowStockItems = useMemo(() => {
    return filteredInventory.filter((item) => item.stock_level <= item.reorder_level)
  }, [filteredInventory])

  const updateStock = async (inventoryId: string, stockDelta: number) => {
    const target = inventory.find((item) => item.id === inventoryId)
    if (!target) return

    const nextStock = Math.max(0, target.stock_level + stockDelta)
    const { error } = await supabase.from('inventory').update({ stock_level: nextStock }).eq('id', inventoryId)

    if (error) {
      console.error('Failed to update stock level:', error)
      return
    }

    setInventory((current) =>
      current.map((item) => (item.id === inventoryId ? { ...item, stock_level: nextStock } : item))
    )

    if (autoSync && nextStock === 0 && target.menu_items?.id) {
      await supabase.from('menu_items').update({ is_available: false }).eq('id', target.menu_items.id)
    }
  }

  const getStatus = (stock: number, reorder: number) => {
    if (stock === 0) return { label: 'Out of Stock', className: 'border-red-500/20 bg-red-500/10 text-red-300' }
    if (stock <= reorder) return { label: 'Low Stock', className: 'border-amber-500/20 bg-amber-500/10 text-amber-300' }
    return { label: 'In Stock', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        Loading inventory dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Inventory Control</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Live stock monitoring</h1>
              <p className="mt-2 text-sm text-zinc-400">Track stock levels, flag low inventory, and restock quickly.</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
              <RefreshCw className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-zinc-300">Auto-sync unavailable items</span>
              <Button
                variant={autoSync ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoSync((value) => !value)}
                className={autoSync ? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400' : 'border-zinc-700 text-zinc-100 hover:bg-zinc-800'}
              >
                {autoSync ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </div>

        {lowStockItems.length > 0 ? (
          <Alert className="border-amber-500/20 bg-amber-500/10 text-amber-200">
            <PackageCheck className="mr-2 inline h-4 w-4" />
            Low stock alert: {lowStockItems.map((item) => item.menu_items?.name).join(', ')}
          </Alert>
        ) : null}

        <Card className="border border-zinc-800 bg-zinc-900/80">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-zinc-100">Inventory Overview</CardTitle>
            <Input
              placeholder="Search by item or category"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-sm border-zinc-800 bg-zinc-950 text-zinc-100"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Reorder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getStatus(item.stock_level, item.reorder_level)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-zinc-100">{item.menu_items?.name || 'Unnamed Item'}</TableCell>
                      <TableCell className="text-zinc-400">{item.menu_items?.category || 'Uncategorized'}</TableCell>
                      <TableCell className="text-zinc-100">{item.stock_level}</TableCell>
                      <TableCell className="text-zinc-400">{item.reorder_level}</TableCell>
                      <TableCell>
                        <Badge className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => void updateStock(item.id, -1)} className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => void updateStock(item.id, 1)} className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
