'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Crown,
  ShoppingBag,
  Calendar,
  RotateCcw,
  MapPin,
  Sparkles,
  Utensils,
  ArrowRight,
  Clock,
  ChevronRight,
  Phone,
  Compass,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  menu_items?: {
    name: string
    category: string
    price?: number
    is_available?: boolean
  }
}

interface Order {
  id: string
  customer_id: string
  total_amount: number
  notes: string | null
  status: string
  created_at: string
  order_items?: OrderItem[]
}

interface Reservation {
  id: string
  customer_id: string
  guest_name?: string
  name?: string
  reservation_date?: string
  date?: string
  reservation_time?: string
  time?: string
  party_size?: number
  guests_count?: number
  status: string
  created_at?: string
}

export default function DashboardPage() {
  const supabase = createClient()
  const { addToCart, setIsOpen } = useCart()
  const { toast } = useToast()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isDirectionsOpen, setIsDirectionsOpen] = useState<boolean>(false)

  // Fetch user profile and dashboard stats
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return
        setUserEmail(user.email || 'Valued Guest')

        // Fetch Orders
        const { data: orderData } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(*))')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        let mergedOrders: Order[] = orderData ? [...(orderData as Order[])] : []

        // Merge localStorage orders (handles Supabase FK failures)
        try {
          const localOrders: Order[] = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
          localOrders.forEach((lOrder) => {
            if (!mergedOrders.some((o) => o.id === lOrder.id)) {
              mergedOrders.unshift(lOrder)
            }
          })
        } catch {}

        setOrders(mergedOrders)

        // Fetch Reservations
        const { data: resData } = await supabase
          .from('reservations')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        let mergedReservations: Reservation[] = resData ? [...(resData as Reservation[])] : []

        // Merge localStorage reservations (handles Supabase schema failures)
        try {
          const localRes: Reservation[] = JSON.parse(localStorage.getItem('platr_user_reservations') || '[]')
          localRes.forEach((lRes) => {
            if (!mergedReservations.some((r) => r.id === lRes.id)) {
              mergedReservations.unshift(lRes)
            }
          })
        } catch {}

        setReservations(mergedReservations)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()

    // Real-time: refetch when a new order lands in Supabase for this user
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const channelName = `dashboard_orders_realtime_${user.id}_${Math.random().toString(36).slice(2)}`
      realtimeChannel = supabase.channel(channelName)

      realtimeChannel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
          () => {
            loadDashboardData()
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` },
          () => {
            loadDashboardData()
          }
        )

      await realtimeChannel.subscribe()
    }

    setupRealtime()

    // Refetch when user returns to this tab (handles localStorage-only orders)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadDashboardData()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (realtimeChannel) supabase.removeChannel(realtimeChannel)
    }
  }, [])

  // Stats Calculations
  const totalOrders = orders.length

  const activeReservationsCount = useMemo(() => {
    return reservations.filter(
      (r) => r.status?.toLowerCase() !== 'cancelled' && r.status?.toLowerCase() !== 'completed'
    ).length
  }, [reservations])

  // Total spent across all orders
  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  }, [orders])

  // Recent 3 orders
  const recentOrders = useMemo(() => orders.slice(0, 3), [orders])

  // Next upcoming reservation
  const upcomingReservation = useMemo(() => {
    return reservations.find((r) => r.status?.toLowerCase() !== 'cancelled') || null
  }, [reservations])

  // Handle Reorder action
  const handleReorder = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast({
        title: 'Reorder Notice',
        description: 'No detailed items found for this past order.',
      })
      return
    }

    let addedCount = 0
    order.order_items.forEach((item) => {
      const menuItem = item.menu_items
      const itemToUse = {
        id: item.menu_item_id || item.id,
        name: menuItem?.name || 'Specialty Dish',
        price: menuItem?.price || item.unit_price || 15.99,
        category: menuItem?.category || 'Main',
        is_available: menuItem?.is_available ?? true,
      }

      for (let i = 0; i < item.quantity; i++) {
        addToCart(itemToUse)
        addedCount++
      }
    })

    toast({
      title: 'Items Added to Cart! 🛒',
      description: `Added ${addedCount} items from Order #${order.id.slice(0, 8)} back into your cart.`,
    })

    setIsOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-0 pb-16">
      {/* Welcome Greeting Header */}
      <div className="royal-card p-6 sm:p-8 border border-amber-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Crown className="h-64 w-64 text-amber-400" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Crown className="h-3.5 w-3.5" />
            Royal Customer Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold gold-gradient-text">
            Welcome back, {userEmail?.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl">
            We are honored to serve you. View your dining stats, reorder favorite delicacies, or track upcoming table reservations.
          </p>
        </div>
      </div>

      {/* Quick Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Stat 1: Total Orders */}
        <Card className="royal-card border border-amber-500/20 hover:border-amber-500/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="text-3xl font-black text-amber-400">{totalOrders}</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 2: Active Reservations */}
        <Card className="royal-card border border-amber-500/20 hover:border-amber-500/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
                Active Reservations
              </span>
              <span className="text-3xl font-black text-amber-400">{activeReservationsCount}</span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Stat 3: Total Spent */}
        <Card className="royal-card border border-amber-500/20 hover:border-amber-500/40">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1 min-w-0 pr-2">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block">
                Total Spent
              </span>
              <span className="text-2xl font-black text-amber-400">
                ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingBag className="h-6 w-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Upcoming Reservation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-400" />
              Recent Orders
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300">
              <Link href="/orders" className="flex items-center gap-1 text-xs font-bold">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="royal-card p-8 text-center space-y-3 border border-zinc-800">
              <Utensils className="h-10 w-10 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400">You haven't placed any orders yet.</p>
              <Button asChild className="royal-button text-xs px-4">
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const statusLower = (order.status || 'pending').toLowerCase()
                const isCompleted = statusLower === 'completed'

                return (
                  <Card
                    key={order.id}
                    className="royal-card border border-amber-500/20 hover:border-amber-500/40 transition-all p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-amber-300">
                            #{order.id.slice(0, 8)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`uppercase text-[10px] font-bold px-2 py-0.5 ${
                              isCompleted
                                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                                : 'border-amber-500/40 text-amber-300 bg-amber-950/30'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-400 flex items-center gap-1 pt-0.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" />
                          {new Date(order.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-xs text-zinc-500 block">Total</span>
                          <span className="text-base font-extrabold text-amber-400">
                            ₹{Number(order.total_amount || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Reorder Button */}
                        <Button
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reorder
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Reservations Section (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            Next Booking
          </h2>

          {loading ? (
            <div className="h-48 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ) : !upcomingReservation ? (
            <div className="royal-card p-6 text-center space-y-3 border border-zinc-800">
              <Crown className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-400">No active table bookings.</p>
              <Button asChild variant="outline" className="border-amber-500/30 text-amber-300 text-xs w-full">
                <Link href="/reservations">Book a Table</Link>
              </Button>
            </div>
          ) : (
            <Card className="royal-card border border-amber-500/30 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase text-[10px] font-bold">
                  {upcomingReservation.status}
                </Badge>
                <span className="text-xs text-zinc-400 font-mono">
                  #{upcomingReservation.id.slice(0, 6)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    {upcomingReservation.reservation_date || upcomingReservation.date || 'Upcoming'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    {upcomingReservation.reservation_time || upcomingReservation.time || '7:00 PM'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    {upcomingReservation.party_size || upcomingReservation.guests_count || 2} Guests Reserved
                  </span>
                </div>
              </div>

              {/* Directions / Details Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDirectionsOpen(true)}
                className="w-full border-amber-500/40 text-amber-300 hover:bg-amber-500/10 flex items-center justify-center gap-1.5"
              >
                <MapPin className="h-4 w-4 text-amber-400" />
                Directions / Details
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Directions / Restaurant Location Modal */}
      <Dialog open={isDirectionsOpen} onOpenChange={setIsDirectionsOpen}>
        <DialogContent className="bg-zinc-950 border-amber-500/30 text-zinc-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gold-gradient-text flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" /> PLATR Royal Dining Location
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              We look forward to welcoming you to an extraordinary culinary journey.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/20 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-zinc-100">Restaurant Address</h4>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    The Royal Palace Dining, 108 Heritage Boulevard, Financial District
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-amber-300 pt-2 border-t border-zinc-800">
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Complimentary Royal Valet Parking Available</span>
              </div>
            </div>

            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="royal-button flex items-center justify-center gap-2 p-3 rounded-xl w-full text-center text-sm font-bold"
            >
              <Compass className="h-4 w-4" />
              Open in Google Maps
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
