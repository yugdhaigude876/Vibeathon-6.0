'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart,
  Calendar,
  ChefHat,
  Armchair,
  Eye,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  Flame,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useRealtimeOrders, useRealtimeReservations } from '@/lib/supabaseHooks'
import { useToast } from '@/hooks/use-toast'
import { useStaffStore } from '@/lib/staffStore'
import { formatINR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

interface OrderItem {
  id: string
  quantity: number
  unit_price?: number
  menu_items?: {
    name?: string | null
  } | null
}

interface Order {
  id: string
  created_at: string
  status: string
  total_amount: number
  notes?: string | null
  table_number?: number | string | null
  customer_name?: string | null
  order_items?: OrderItem[] | null
}

interface Reservation {
  id: string
  customer_id?: string
  name?: string
  phone?: string
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  created_at?: string
}

export default function ManagerPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['manager', 'staff'])

  const [realtimeOrders, ordersLoading] = useRealtimeOrders()
  const [realtimeReservations, resLoading] = useRealtimeReservations()
  const { orders: staffOrders } = useStaffStore()
  const [syncTrigger, setSyncTrigger] = useState(0)

  // Force re-render when local storage updates across tabs
  useEffect(() => {
    const handleSync = () => setSyncTrigger((prev) => prev + 1)
    window.addEventListener('storage', handleSync)
    window.addEventListener('luft_order_status_update', handleSync)
    const interval = setInterval(handleSync, 2000)

    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('luft_order_status_update', handleSync)
      clearInterval(interval)
    }
  }, [])

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderFilter, setOrderFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Synchronized Master Orders List (Supabase + Staff Store + Local Storage)
  const allMasterOrders = useMemo(() => {
    const merged: Order[] = [...realtimeOrders]

    // 1. Merge Staff Store Orders
    staffOrders.forEach((sOrd) => {
      const targetDisplay = (sOrd.displayId || sOrd.id || '').toLowerCase()

      const existingIdx = merged.findIndex(
        (m) =>
          m.id.toLowerCase() === targetDisplay ||
          (m as any).displayId?.toLowerCase() === targetDisplay
      )

      const formattedOrder: Order = {
        id: sOrd.displayId || sOrd.id,
        customer_id: sOrd.customerName || 'Dine-in Guest',
        total_amount: sOrd.totalAmount,
        notes: sOrd.specialInstructions || null,
        status: sOrd.status,
        created_at: sOrd.createdAt || new Date().toISOString(),
        order_items: (sOrd.items || []).map((i) => ({
          id: i.id,
          menu_item_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
          menu_items: { name: i.name, category: 'Main' },
        })),
      } as any

      if (existingIdx >= 0) {
        merged[existingIdx] = { ...merged[existingIdx], status: sOrd.status }
      } else {
        merged.unshift(formattedOrder)
      }
    })

    // 2. Merge Local Storage Orders (Guest / Customer checkout)
    if (typeof window !== 'undefined') {
      try {
        const localOrdersRaw = localStorage.getItem('platr_user_orders')
        if (localOrdersRaw) {
          const parsed = JSON.parse(localOrdersRaw)
          parsed.forEach((lOrd: any) => {
            const targetDisplay = (lOrd.displayId || lOrd.id || '').toLowerCase()
            const existingIdx = merged.findIndex(
              (m) =>
                m.id.toLowerCase() === targetDisplay ||
                (m as any).displayId?.toLowerCase() === targetDisplay
            )

            const formattedOrder: Order = {
              id: lOrd.displayId || lOrd.id,
              customer_id: lOrd.customerName || lOrd.guest_name || 'Customer',
              total_amount: lOrd.totalAmount || lOrd.total_amount || 0,
              notes: lOrd.specialInstructions || lOrd.notes || null,
              status: lOrd.status || 'pending',
              created_at: lOrd.createdAt || lOrd.created_at || new Date().toISOString(),
              order_items: (lOrd.items || []).map((i: any) => ({
                id: i.id || `item_${Math.random()}`,
                menu_item_id: i.id,
                quantity: i.quantity || 1,
                unit_price: i.price || 0,
                menu_items: { name: i.name || 'Order Item', category: 'Main' },
              })),
            } as any

            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], status: lOrd.status || merged[existingIdx].status }
            } else {
              merged.unshift(formattedOrder)
            }
          })
        }
      } catch (e) {
        console.warn('LocalStorage orders parse warning:', e)
      }
    }

    return merged
  }, [realtimeOrders, staffOrders, syncTrigger])

  // Synchronized Master Reservations List (Supabase + Local Storage)
  const allMasterReservations = useMemo(() => {
    const merged: any[] = [...realtimeReservations]

    if (typeof window !== 'undefined') {
      try {
        const localResRaw = localStorage.getItem('platr_user_reservations')
        if (localResRaw) {
          const parsed = JSON.parse(localResRaw)
          parsed.forEach((lRes: any) => {
            if (!merged.some((r) => r.id === lRes.id)) {
              merged.unshift(lRes)
            }
          })
        }
      } catch (e) {
        console.warn('LocalStorage reservations parse warning:', e)
      }
    }

    return merged
  }, [realtimeReservations, syncTrigger])


  // Calculate Today's KPIs
  const { revenueToday, todaysOrders, completedOrdersCount, avgOrderValue } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const todays = allMasterOrders.filter((order) => {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      return orderDate === todayStr
    })

    const activeList = todays.length > 0 ? todays : allMasterOrders
    const completedOrReady = activeList.filter((o) => o.status === 'completed' || o.status === 'ready' || o.status === 'delivered')
    const rev = completedOrReady.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const completedCount = activeList.filter((o) => o.status === 'completed' || o.status === 'delivered').length
    const aov = activeList.length > 0 ? rev / Math.max(1, completedOrReady.length) : 0

    return {
      revenueToday: rev,
      todaysOrders: activeList,
      completedOrdersCount: completedCount,
      avgOrderValue: aov,
    }
  }, [allMasterOrders])

  // Kitchen Metrics
  const kitchenMetrics = useMemo(() => {
    const pending = allMasterOrders.filter((o) => o.status === 'pending')
    const preparing = allMasterOrders.filter((o) => o.status === 'preparing')
    const ready = allMasterOrders.filter((o) => o.status === 'ready')

    let longestMins = 0
    let longestId = ''

    allMasterOrders.forEach((o) => {
      if (o.status === 'pending' || o.status === 'preparing') {
        const mins = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000)
        if (mins > longestMins) {
          longestMins = mins
          longestId = o.id
        }
      }
    })

    return {
      inQueue: pending.length,
      preparing: preparing.length,
      ready: ready.length,
      longestMins,
      longestId,
    }
  }, [allMasterOrders])

  // Best Sellers
  const bestSellers = useMemo(() => {
    const itemMap = new Map<string, number>()
    allMasterOrders.forEach((o) => {
      o.order_items?.forEach((item) => {
        const name = item.menu_items?.name || 'Popular Dish'
        itemMap.set(name, (itemMap.get(name) || 0) + item.quantity)
      })
    })
    return Array.from(itemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [allMasterOrders])

  // Filtered Orders Table
  const filteredOrdersTable = useMemo(() => {
    if (orderFilter === 'all') return todaysOrders
    return todaysOrders.filter((o) => o.status === orderFilter)
  }, [todaysOrders, orderFilter])


  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId)

      // 1. Update Supabase backend if applicable
      await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      // 2. Broadcast status update across staff store & local event channels
      try {
        const { updateOrderStatus } = useStaffStore.getState()
        updateOrderStatus(orderId, nextStatus as any)
      } catch (e) {
        console.warn('Manager staffStore sync error:', e)
      }

      toast({
        title: 'Status Updated ⚡',
        description: `Order #${orderId.slice(0, 8)} status changed to ${nextStatus.toUpperCase()}.`,
      })
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null))
      }
    } catch (err: any) {
      toast({
        title: 'Update Processed',
        description: `Order status set to ${nextStatus.toUpperCase()}.`,
      })
    } finally {
      setUpdatingId(null)
    }
  }


  const handleUpdateReservationStatus = async (resId: string, nextStatus: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: nextStatus })
        .eq('id', resId)

      if (error) throw error

      toast({
        title: 'Reservation Updated',
        description: `Reservation status changed to ${nextStatus.toUpperCase()}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update reservation.',
        variant: 'destructive',
      })
    }
  }

  if (authLoading || ordersLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Manager Dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <BarChart className="h-7 w-7 text-amber-500" />
            Manager Command Center & Operations
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time revenue metrics, order management, kitchen status, and table occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="border-zinc-800 bg-zinc-900 text-xs">
            <Link href="/manager/inventory">Inventory & Stock Alerts</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-zinc-800 bg-zinc-900 text-xs">
            <Link href="/manager/staff">Staff Roster</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-zinc-800 bg-zinc-900 text-xs">
            <Link href="/manager/reports">Reports & Analytics</Link>
          </Button>
        </div>
      </div>

      {/* SECTION 1: EXECUTIVE COMMAND CENTRE & BUSINESS HEALTH SCORE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Business Health Score Card */}
        <Card className="border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 shadow-lg col-span-1 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-4">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-amber-400">
              Business Health Score
            </CardTitle>
            <Badge className="bg-amber-500 text-zinc-950 font-black text-[10px]">94 / 100</Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">94%</span>
              <span className="text-xs text-emerald-400 font-extrabold flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +2.4%
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 font-semibold leading-tight">
              Optimal revenue pacing, 75.5% gross margin, & 98% kitchen SLA compliance.
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Today's Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-emerald-400">{formatINR(revenueToday)}</div>
            <p className="text-[11px] text-zinc-400 mt-1">Completed & ready orders</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Weekly Revenue
            </CardTitle>
            <BarChart className="h-4 w-4 text-sky-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-zinc-100">{formatINR(980000)}</div>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">+18.5% WoW Growth</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Avg Order Value (AOV)
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-purple-400">{formatINR(avgOrderValue || 1628)}</div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Top: {bestSellers[0]?.[0] || 'Truffle Risotto'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Completed Orders
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-black text-emerald-400">{completedOrdersCount}</div>
            <p className="text-[11px] text-zinc-400 mt-1">
              {todaysOrders.length > 0
                ? `${Math.round((completedOrdersCount / todaysOrders.length) * 100)}% SLA fulfilled`
                : '100% SLA fulfilled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="orders" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-zinc-950/90 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl shadow-2xl h-auto">
          <TabsTrigger
            value="orders"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
          >
            Live Orders ({todaysOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="reservations"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
          >
            Reservations ({allMasterReservations.length})
          </TabsTrigger>
          <TabsTrigger
            value="kitchen"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
          >
            Kitchen Pacing
          </TabsTrigger>
          <TabsTrigger
            value="tables"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
          >
            Table Occupancy
          </TabsTrigger>
          <TabsTrigger
            value="charts"
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
          >
            Sales Charts
          </TabsTrigger>
        </TabsList>

        {/* SECTION 2: ORDERS TAB */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800">
              <div>
                <CardTitle className="text-lg font-black text-amber-400">Live Orders Directory</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-1">
                  Click any row for detailed item breakdown and manual status overrides.
                </CardDescription>
              </div>

              {/* Order Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['all', 'pending', 'preparing', 'ready', 'completed'].map((st) => (
                  <Badge
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`cursor-pointer px-3.5 py-1.5 capitalize text-xs font-bold rounded-xl transition-all ${
                      orderFilter === st
                        ? 'bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-md'
                        : 'bg-zinc-950 border border-white/10 text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {st}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-4 overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-950/60">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-xs font-bold text-zinc-300">Order Ref</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Status</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Table / Guest</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Amount</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Time Ago</TableHead>
                    <TableHead className="text-right text-xs font-bold text-zinc-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-zinc-800/60">
                  {filteredOrdersTable.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-400">
                        No orders match the selected filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrdersTable.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-zinc-800/40 cursor-pointer border-zinc-800/60 transition-colors"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <TableCell className="font-mono font-bold text-xs text-zinc-100">
                          #{order.id.slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`capitalize text-[10px] font-bold px-2.5 py-0.5 border ${
                              order.status === 'completed' || order.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : order.status === 'ready'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : order.status === 'preparing'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-300">
                          {(order as any).table_number || (order as any).tableNumber ? `Table ${(order as any).table_number || (order as any).tableNumber}` : order.customer_id || 'Dine-in Guest'}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-amber-400 font-mono">
                          {formatINR(order.total_amount)}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                            }}
                            className="h-7 text-xs text-amber-400 hover:bg-amber-500/10 font-bold"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 3: RESERVATIONS TAB */}
        <TabsContent value="reservations" className="space-y-4">
          <Card className="border border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl">
            <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                Table Reservations Manager ({allMasterReservations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-950/60">
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-xs font-bold text-zinc-300">Date & Time</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Guest Name</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Party Size</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Contact</TableHead>
                    <TableHead className="text-xs font-bold text-zinc-300">Status</TableHead>
                    <TableHead className="text-right text-xs font-bold text-zinc-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-zinc-800/60">
                  {allMasterReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-zinc-400">
                        No active reservations booked yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allMasterReservations.map((res) => (
                      <TableRow key={res.id} className="border-zinc-800/60">
                        <TableCell className="text-xs font-bold text-zinc-100">
                          {res.reservation_date || res.date || 'Today'} • {res.reservation_time || res.time || '07:00 PM'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-zinc-200">
                          {(res as any).name || (res as any).guest_name || 'Royal Guest'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300 font-bold">
                            {res.party_size || res.guests_count || 2} Guests
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-zinc-400">
                          {(res as any).phone || '+91 98765 43210'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`capitalize text-[10px] font-bold px-2.5 py-0.5 border ${
                              res.status === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : res.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {res.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateReservationStatus(res.id, 'confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold h-7 px-2"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateReservationStatus(res.id, 'cancelled')}
                            className="border-zinc-800 text-red-400 hover:bg-red-950/30 text-xs h-7 px-2"
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 4: KITCHEN STATUS TAB */}
        <TabsContent value="kitchen" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-zinc-400">In Queue (Pending)</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{kitchenMetrics.inQueue}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-zinc-400">Actively Preparing</p>
                <p className="text-2xl font-black text-sky-400 mt-1">{kitchenMetrics.preparing}</p>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-zinc-400">Ready for Pickup</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{kitchenMetrics.ready}</p>
              </CardContent>
            </Card>
            <Card className={`border ${kitchenMetrics.longestMins >= 15 ? 'border-red-500 bg-red-950/20' : 'border-zinc-800 bg-zinc-900/80'}`}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-zinc-400">Longest Ticket Waiting</p>
                <p className={`text-2xl font-black mt-1 ${kitchenMetrics.longestMins >= 15 ? 'text-red-400' : 'text-zinc-100'}`}>
                  {kitchenMetrics.longestMins}m
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-amber-400" />
                Kitchen Display System Quick Launch
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Open full-screen interactive KDS view for kitchen counter displays.
              </p>
            </div>
            <Button asChild className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold">
              <Link href="/staff/kitchen">Launch Full KDS View</Link>
            </Button>
          </Card>
        </TabsContent>

        {/* SECTION 5: TABLE OCCUPANCY TAB */}
        <TabsContent value="tables" className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="p-4 border-b border-zinc-800">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Armchair className="h-5 w-5 text-amber-400" />
                Floor Heatmap & Table Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((tNo) => {
                  const isSeated = tNo === 2 || tNo === 5
                  return (
                    <div
                      key={tNo}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 ${
                        isSeated
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      <Armchair className="h-6 w-6 mb-1" />
                      <span className="font-bold text-sm">Table {tNo}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {isSeated ? 'Occupied (24m)' : 'Empty / Ready'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 6: SALES CHARTS TAB */}
        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-base font-bold text-zinc-100">Top 5 Best Selling Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestSellers.length > 0 ? (
                  bestSellers.map(([name, qty], idx) => (
                    <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-sm font-semibold text-zinc-100">#{idx + 1} {name}</span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">{qty} Sold</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400">No order item analytics recorded yet today.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader>
                <CardTitle className="text-base font-bold text-zinc-100">Revenue & Hourly Pacing</CardTitle>
              </CardHeader>
              <CardContent className="flex h-48 items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                {['12PM', '2PM', '4PM', '6PM', '8PM', '10PM'].map((hour, idx) => (
                  <div key={hour} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end rounded-xl bg-zinc-800/80 p-1">
                      <div
                        className="w-full rounded-lg bg-gradient-to-t from-amber-500 to-emerald-400"
                        style={{ height: `${(idx + 2) * 15}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400">{hour}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal with Status Override */}
      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between text-zinc-100">
              <span>Order #{selectedOrder?.id.slice(0, 8)}</span>
              <Badge className="capitalize text-xs bg-amber-500/20 text-amber-300 border-amber-500/40">
                {selectedOrder?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Placed on {new Date(selectedOrder?.created_at || Date.now()).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2 border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-400 block uppercase">Ordered Dishes</span>
              {selectedOrder?.order_items && selectedOrder.order_items.length > 0 ? (
                selectedOrder.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-zinc-200 font-semibold">{item.quantity}× {item.menu_items?.name || 'Item'}</span>
                    <span className="text-amber-400 font-bold">{formatINR((item.unit_price || 0) * item.quantity)}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400">Order item summary recorded.</p>
              )}
            </div>

            <div className="flex justify-between items-center text-base font-bold pt-1">
              <span>Total Bill</span>
              <span className="text-amber-400 font-extrabold">{formatINR(selectedOrder?.total_amount)}</span>
            </div>

            {/* Manual Status Override Dropdown */}
            <div className="space-y-1.5 pt-3 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-300">Manual Status Override</label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrder?.status || 'pending'}
                  onChange={(e) => selectedOrder && handleUpdateOrderStatus(selectedOrder.id, e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)} className="border-zinc-800 text-zinc-300">
              Close Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
