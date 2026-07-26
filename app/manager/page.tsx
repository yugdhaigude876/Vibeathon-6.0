'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'

import { createClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Profile {
  id: string
  role?: string | null
  full_name?: string | null
}

interface OrderItem {
  id: string
  quantity: number
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

export default function ManagerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    const loadData = async () => {
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

      setProfile(profileData as Profile | null)

      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name))')
        .order('created_at', { ascending: false })

      if (orderData) {
        setOrders(orderData as Order[])
      }

      setLoading(false)
    }

    void loadData()
  }, [router, supabase])

  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  const todaysOrders = useMemo(() => {
    return orders.filter((order) => {
      const createdAt = new Date(order.created_at)
      return createdAt >= startOfDay && createdAt <= endOfDay
    })
  }, [orders, startOfDay, endOfDay])

  const revenueToday = useMemo(() => {
    return todaysOrders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
  }, [todaysOrders])

  const activeTables = useMemo(() => {
    const activeStatuses = ['pending', 'preparing', 'ready']
    const tableSet = new Set(
      todaysOrders
        .filter((order) => activeStatuses.includes(order.status))
        .map((order) => String(order.table_number ?? 'walk-in'))
    )
    return tableSet.size
  }, [todaysOrders])

  const totalTables = 12

  const pendingReservations = useMemo(() => {
    return orders.filter((order) => order.status === 'pending').length
  }, [orders])

  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      date.setHours(0, 0, 0, 0)
      return date
    })

    return last7Days.map((day) => {
      const dayStart = new Date(day)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      const dayOrders = orders.filter((order) => {
        const createdAt = new Date(order.created_at)
        return createdAt >= dayStart && createdAt <= dayEnd
      })

      const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
      const count = dayOrders.length

      return {
        label: day.toLocaleDateString('en', { weekday: 'short' }),
        revenue,
        count,
      }
    })
  }, [orders, today])

  const bestSellers = useMemo(() => {
    const counts = new Map<string, number>()

    orders.forEach((order) => {
      order.order_items?.forEach((item) => {
        const name = item.menu_items?.name || 'Unknown Item'
        counts.set(name, (counts.get(name) || 0) + item.quantity)
      })
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [orders])

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        Loading manager dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Manager Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Restaurant performance snapshot</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Welcome back, {profile?.full_name || 'Manager'} — here’s today’s operational pulse.
            </p>
          </div>
          <Badge className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
            <TrendingUp className="mr-2 h-4 w-4" />
            Live data
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Today’s Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-100">${revenueToday.toFixed(2)}</div>
              <p className="mt-1 text-sm text-zinc-500">Completed orders only</p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Orders Today</CardTitle>
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-100">{todaysOrders.length}</div>
              <p className="mt-1 text-sm text-zinc-500">Across all live statuses</p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Active Tables</CardTitle>
              <Users className="h-4 w-4 text-sky-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-100">{activeTables}/{totalTables}</div>
              <p className="mt-1 text-sm text-zinc-500">Seated or in progress</p>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Pending Reservations</CardTitle>
              <Award className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-100">{pendingReservations}</div>
              <p className="mt-1 text-sm text-zinc-500">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">Revenue & Orders Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-end gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                {trendData.map((day) => {
                  const maxRevenue = Math.max(...trendData.map((entry) => entry.revenue), 1)
                  const height = Math.max(16, (day.revenue / maxRevenue) * 100)
                  return (
                    <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-32 w-full items-end rounded-xl bg-zinc-800/80 p-1">
                        <div
                          className="w-full rounded-lg bg-gradient-to-t from-amber-500 to-emerald-400"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="text-center text-xs text-zinc-400">
                        <div className="font-semibold text-zinc-200">{day.label}</div>
                        <div>${day.revenue.toFixed(0)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-sm text-zinc-400">Average orders per day</p>
                  <p className="mt-1 text-xl font-semibold text-zinc-100">
                    {(orders.length / Math.max(1, Math.min(7, trendData.length))).toFixed(1)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-sm text-zinc-400">Peak day</p>
                  <p className="mt-1 text-xl font-semibold text-zinc-100">
                    {trendData.reduce((peak, item) => (item.revenue > peak.revenue ? item : peak), trendData[0])?.label ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">Top 5 Best Sellers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bestSellers.length > 0 ? (
                bestSellers.map(([name, quantity], index) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                    <div>
                      <p className="font-medium text-zinc-100">{name}</p>
                      <p className="text-sm text-zinc-400">#{index + 1} this period</p>
                    </div>
                    <Badge className="border-zinc-700 bg-zinc-800 text-zinc-200">x{quantity}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No item data available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-zinc-800 bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-zinc-100">Recent Orders</CardTitle>
            <Badge className="border-zinc-700 bg-zinc-800 text-zinc-200">Last 5</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-zinc-100">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge className="capitalize border-zinc-700 bg-zinc-800 text-zinc-200">{order.status}</Badge>
                    </TableCell>
                    <TableCell>{order.table_number ?? 'Walk-in'}</TableCell>
                    <TableCell>${Number(order.total_amount || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Snapshot of the selected order.</DialogDescription>
          </DialogHeader>
          {selectedOrder ? (
            <div className="space-y-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <span className="text-zinc-400">Order</span>
                <span className="font-semibold text-zinc-100">#{selectedOrder.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <span className="text-zinc-400">Status</span>
                <Badge className="capitalize border-zinc-700 bg-zinc-800 text-zinc-200">{selectedOrder.status}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <span className="text-zinc-400">Table</span>
                <span className="font-semibold text-zinc-100">{selectedOrder.table_number ?? 'Walk-in'}</span>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <div className="mb-2 text-zinc-400">Items</div>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-zinc-100">{item.menu_items?.name || 'Item'}</span>
                      <span className="text-zinc-400">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-3">
                <span className="text-zinc-400">Notes</span>
                <span className="max-w-[60%] text-right text-zinc-100">{selectedOrder.notes || 'None'}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
