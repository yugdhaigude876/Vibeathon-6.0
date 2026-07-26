'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, ClipboardList, Clock, ArrowRight, Utensils, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'

interface Order {
  id: string
  customer_id: string
  total_amount: number
  notes: string | null
  status: string
  created_at: string
}

export default function OrdersPage() {
  const supabase = createClient()
  const { authorized, loading: authLoading } = useRoleGuard(['customer'])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
      query = query.eq('customer_id', user.id)

      const { data, error: fetchErr } = await query

      if (fetchErr) {
        console.warn('Error fetching orders:', fetchErr?.message || fetchErr)
        setError(fetchErr.message)
      } else if (data) {
        setOrders(data as Order[])
      }
    } catch (err: any) {
      console.error('Unexpected error fetching orders:', err)
      setError(err?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authorized) return

    fetchOrders()

    // Real-time listener for orders table
    const channel = supabase
      .channel('orders_list_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authorized])

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-6">
        <div className="space-y-3">
          <BreadcrumbNav items={[{ label: 'Home', href: '/' }, { label: 'Orders' }]} />
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-400" />
              <h1 className="text-3xl font-extrabold gold-gradient-text">Your Royal Orders</h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              Track live preparation progress and view past dining receipts.
            </p>
          </div>
        </div>

        <Button asChild className="royal-button px-5">
          <Link href="/menu">
            <Utensils className="h-4 w-4 mr-2" /> Order New Dish
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="royal-card p-12 text-center space-y-4">
          <ClipboardList className="h-12 w-12 text-zinc-600 mx-auto" />
          <h3 className="text-xl font-bold text-zinc-300">No Orders Found</h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            You haven't placed any orders yet. Visit our digital menu to indulge in our royal dishes!
          </p>
          <Button asChild className="royal-button mt-4">
            <Link href="/menu">Browse Royal Menu</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusUpper = (order.status || 'pending').toUpperCase()
            const isCompleted = order.status?.toLowerCase() === 'completed'
            const statusKey = (order.status || 'pending').toLowerCase()
            const orderSteps = ['pending', 'preparing', 'ready', 'completed']
            const activeIndex = Math.max(0, orderSteps.indexOf(statusKey))

            return (
              <Card
                key={order.id}
                className="royal-card hover:border-amber-500/50 transition-all group overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-amber-300">
                          #{order.id.slice(0, 8)}...
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-0.5 uppercase tracking-wider font-semibold ${
                            isCompleted
                              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                              : 'border-amber-500/40 text-amber-300 bg-amber-950/30'
                          }`}
                        >
                          {statusUpper}
                        </Badge>
                      </div>

                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-1">
                        <Clock className="h-3.5 w-3.5 text-amber-500/80" />
                        {new Date(order.created_at || Date.now()).toLocaleString()}
                      </p>

                      {order.notes && (
                        <p className="text-xs text-zinc-400 italic pt-0.5">
                          Notes: {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 block">Total Amount</span>
                        <span className="text-lg font-black text-amber-400">
                          ${Number(order.total_amount || 0).toFixed(2)}
                        </span>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="bg-zinc-800 group-hover:bg-amber-600 group-hover:text-zinc-950 text-zinc-200 font-bold transition-all"
                      >
                        <Link href={`/orders/${order.id}`} className="flex items-center gap-1.5">
                          Track Status
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                        </span>
                        Live tracking · {statusUpper}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {orderSteps.map((step, idx) => (
                          <div
                            key={`${order.id}-${step}`}
                            className={`h-2 flex-1 rounded-full transition-all ${idx <= activeIndex ? 'bg-amber-500' : 'bg-zinc-800'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
