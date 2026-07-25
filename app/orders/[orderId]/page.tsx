'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, Clock, Utensils, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  menu_items?: {
    name: string
    category: string
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

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params?.orderId as string
  const supabase = createClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    async function fetchOrder() {
      try {
        setLoading(true)
        setError(null)

        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*, order_items(*, menu_items(name, category))')
          .eq('id', orderId)
          .single()

        if (orderErr) {
          // If relationship query fails, try simple query
          const { data: simpleOrder, error: simpleErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

          if (simpleErr) {
            setError(simpleErr.message)
          } else {
            setOrder(simpleOrder)
          }
        } else {
          setOrder(orderData)
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load order details.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, supabase])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-zinc-400">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-100">Order Placed</h2>
          <p className="text-sm text-zinc-400">
            Order Reference: <span className="font-mono text-amber-400">#{orderId}</span>
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button asChild variant="outline" className="border-zinc-700 text-zinc-300">
              <Link href="/menu">
                <Utensils className="h-4 w-4 mr-2" /> Back to Menu
              </Link>
            </Button>
            <Button asChild className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold">
              <Link href="/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 sm:px-0">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
          <Link href="/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 flex items-center gap-2">
            Order Confirmation
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Order ID: <span className="font-mono text-zinc-200">{order.id}</span>
          </p>
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/90 text-zinc-50 overflow-hidden">
        <CardHeader className="border-b border-zinc-800 bg-zinc-950/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              <div>
                <CardTitle className="text-lg font-bold text-zinc-100">
                  Order Received & Pending
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  {new Date(order.created_at || Date.now()).toLocaleString()}
                </p>
              </div>
            </div>
            <Badge className="w-fit uppercase text-xs px-3 py-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
              {order.status || 'pending'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Notes / Table Number */}
          {order.notes && (
            <div className="rounded-lg bg-zinc-950/80 p-3.5 border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 block mb-0.5">
                Table Number / Notes:
              </span>
              <p className="text-sm text-zinc-200 font-medium">{order.notes}</p>
            </div>
          )}

          {/* Items Breakdown */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                Order Items
              </h3>
              <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80 bg-zinc-950/40">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 text-sm">
                    <div>
                      <span className="font-semibold text-zinc-200">
                        {item.menu_items?.name || `Item #${item.menu_item_id}`}
                      </span>
                      <span className="text-xs text-zinc-400 block">
                        Qty: {item.quantity} × ${Number(item.unit_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-bold text-amber-400">
                      ${(item.quantity * Number(item.unit_price || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="pt-4 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Total Amount Paid</span>
              <span className="text-xl font-bold text-amber-400">
                ${Number(order.total_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-2">
        <Button asChild variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
          <Link href="/menu">
            <Utensils className="h-4 w-4 mr-2" /> Back to Menu
          </Link>
        </Button>
        <Button asChild className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold">
          <Link href="/orders">View All Orders</Link>
        </Button>
      </div>
    </div>
  )
}
