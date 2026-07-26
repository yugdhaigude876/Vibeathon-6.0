'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, Clock, Flame, Utensils } from 'lucide-react'

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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed'

interface MenuItem {
  id: string
  name: string
  is_available?: boolean | null
  category?: string | null
}

interface OrderItem {
  id: string
  quantity: number
  menu_items?: {
    name?: string | null
    is_available?: boolean | null
  } | null
}

interface Order {
  id: string
  created_at: string
  status: OrderStatus
  notes?: string | null
  table_number?: number | string | null
  customer_name?: string | null
  guest_name?: string | null
  order_items?: OrderItem[] | null
}

const visibleStatuses: OrderStatus[] = ['pending', 'preparing', 'ready']

function formatElapsedTime(createdAt: string, now: number) {
  const diffMinutes = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} mins ago`

  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function KitchenPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false)

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(name, is_available))')
      .in('status', visibleStatuses)
      .order('created_at', { ascending: true })

    if (data) {
      setOrders(data as Order[])
    }
  }

  const fetchMenuItems = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('name', { ascending: true })

    if (data) {
      setMenuItems(data as MenuItem[])
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchOrders(), fetchMenuItems()])
      if (!isMounted) return
      setLoading(false)
    }

    void loadData()

    const timer = window.setInterval(() => setNow(Date.now()), 30000)

    const channel = supabase.channel('kds-orders')

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        void fetchOrders()
      }
    )

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu_items' },
      () => {
        void fetchMenuItems()
      }
    )

    channel.subscribe()

    return () => {
      isMounted = false
      window.clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const groupedOrders = useMemo(() => {
    return {
      pending: orders.filter((order) => order.status === 'pending'),
      preparing: orders.filter((order) => order.status === 'preparing'),
      ready: orders.filter((order) => order.status === 'ready'),
    }
  }, [orders])

  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId)

    if (error) {
      console.error('Failed to update order status:', error)
      return
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)))
  }

  const toggleMenuItemAvailability = async (itemId: string, nextValue: boolean) => {
    const { error } = await supabase.from('menu_items').update({ is_available: nextValue }).eq('id', itemId)

    if (error) {
      console.error('Failed to update menu item availability:', error)
      return
    }

    setMenuItems((current) => current.map((item) => (item.id === itemId ? { ...item, is_available: nextValue } : item)))
  }

  const renderOrderCard = (order: Order) => {
    const summaryLabel = order.table_number ?? order.customer_name ?? order.guest_name ?? 'Walk-in'

    return (
      <Card key={order.id} className="border border-zinc-800 bg-zinc-950/80 shadow-lg">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-zinc-100">Order #{order.id.slice(0, 8)}</CardTitle>
              <p className="mt-1 text-sm text-zinc-400">{summaryLabel}</p>
            </div>
            <Badge className="capitalize border-zinc-700 bg-zinc-900 text-zinc-200">
              {order.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/70 px-2 py-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(order.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-300">
              <Flame className="h-3.5 w-3.5" />
              {formatElapsedTime(order.created_at, now)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Utensils className="h-4 w-4 text-amber-400" />
              Order Items
            </div>
            <ul className="space-y-2 text-sm text-zinc-300">
              {order.order_items?.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950/70 px-2 py-2">
                  <span className="font-semibold text-zinc-100">{item.quantity} × {item.menu_items?.name ?? 'Item'}</span>
                  <Badge variant="outline" className="border-zinc-800 text-zinc-400">
                    {item.quantity > 1 ? `${item.quantity} serves` : 'single'}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          {order.notes ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Special Requests
              </div>
              <p>{order.notes}</p>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            {order.status === 'pending' ? (
              <Button onClick={() => void updateOrderStatus(order.id, 'preparing')} className="flex-1 bg-amber-500 text-zinc-950 hover:bg-amber-400">
                <Flame className="mr-2 h-4 w-4" />
                Start Preparing
              </Button>
            ) : null}

            {order.status === 'preparing' ? (
              <Button onClick={() => void updateOrderStatus(order.id, 'ready')} className="flex-1 bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
                <Check className="mr-2 h-4 w-4" />
                Mark Ready
              </Button>
            ) : null}

            {order.status === 'ready' ? (
              <Button onClick={() => void updateOrderStatus(order.id, 'completed')} variant="outline" className="flex-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
                <Check className="mr-2 h-4 w-4" />
                Complete Order
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">Kitchen Display System</p>
            <h1 className="mt-1 text-3xl font-semibold text-zinc-50">Real-Time Order Board</h1>
            <p className="mt-2 text-sm text-zinc-400">Track live orders from pending to completion with one tap.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <Check className="mr-2 h-4 w-4" />
              Live updates on
            </Badge>

            <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                  Quick Actions
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Menu Availability</DialogTitle>
                  <DialogDescription>Toggle featured dishes on or off for the floor team.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-3">
                      <div>
                        <p className="font-medium text-zinc-100">{item.name}</p>
                        <p className="text-sm text-zinc-400">{item.category ?? 'Kitchen item'}</p>
                      </div>
                      <Switch
                        checked={Boolean(item.is_available)}
                        onCheckedChange={(checked) => void toggleMenuItemAvailability(item.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center text-zinc-400">
            Loading kitchen board...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-300">Pending</p>
                  <p className="text-xs text-amber-200/80">New orders waiting for prep</p>
                </div>
                <Badge className="border-amber-500/20 bg-amber-500/20 text-amber-100">{groupedOrders.pending.length}</Badge>
              </div>
              <div className="space-y-4">{groupedOrders.pending.map(renderOrderCard)}</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-300">Preparing</p>
                  <p className="text-xs text-emerald-200/80">Orders actively being cooked</p>
                </div>
                <Badge className="border-emerald-500/20 bg-emerald-500/20 text-emerald-100">{groupedOrders.preparing.length}</Badge>
              </div>
              <div className="space-y-4">{groupedOrders.preparing.map(renderOrderCard)}</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-sky-300">Ready</p>
                  <p className="text-xs text-sky-200/80">Ready for pickup or delivery</p>
                </div>
                <Badge className="border-sky-500/20 bg-sky-500/20 text-sky-100">{groupedOrders.ready.length}</Badge>
              </div>
              <div className="space-y-4">{groupedOrders.ready.map(renderOrderCard)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
