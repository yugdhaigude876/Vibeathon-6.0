'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Bell,
  Utensils,
  CheckCheck,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useRealtimeOrders } from '@/lib/supabaseHooks'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  total_amount?: number
  notes?: string | null
  table_number?: number | string | null
  customer_name?: string | null
  guest_name?: string | null
  order_items?: OrderItem[] | null
}

function formatElapsedTime(createdAt: string, now: number) {
  const diffMs = now - new Date(createdAt).getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return { text: 'just now', minutes: 0 }
  if (diffMinutes < 60) return { text: `${diffMinutes}m ago`, minutes: diffMinutes }

  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return { text: `${hours}h ${mins}m ago`, minutes: diffMinutes }
}

// Web Audio API chime sound generator for new order alert
function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.1)
    osc2.stop(ctx.currentTime + 0.8)
  } catch (e) {
    // Audio context silent fallback
  }
}

export default function KitchenPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['staff', 'manager'])

  const [realtimeOrders, ordersLoading] = useRealtimeOrders()
  const [now, setNow] = useState(() => Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [prevCount, setPrevCount] = useState<number | null>(null)

  // Timer tick every 15 seconds to update "mins ago"
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(interval)
  }, [])

  // Detect new order arrival and play sound + toast
  useEffect(() => {
    if (!authorized) return
    const inProgressCount = realtimeOrders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing'
    ).length

    if (prevCount !== null && inProgressCount > prevCount) {
      toast({
        title: '🔔 New Order Arrived!',
        description: 'A new order ticket has been added to the kitchen queue.',
      })
      if (soundEnabled) {
        playChimeSound()
      }
    }
    setPrevCount(inProgressCount)
  }, [realtimeOrders, prevCount, soundEnabled, authorized, toast])

  // Filter & sort orders
  const { inProgressOrders, readyOrders } = useMemo(() => {
    const inProgress = realtimeOrders
      .filter((o) => o.status === 'pending' || o.status === 'preparing')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Oldest first

    const ready = realtimeOrders
      .filter((o) => o.status === 'ready')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest ready first

    return { inProgressOrders: inProgress, readyOrders: ready }
  }, [realtimeOrders])

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId)
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId)

      if (error) {
        throw error
      }

      toast({
        title: 'Status Updated',
        description: `Order #${orderId.slice(0, 8)} moved to "${nextStatus.toUpperCase()}".`,
      })
    } catch (err: any) {
      toast({
        title: 'Update Error',
        description: err.message || 'Failed to update order status.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Kitchen Display System...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6">
      {/* Header Chrome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ChefHat className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-zinc-50">
                Kitchen Display System (KDS)
              </h1>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs animate-pulse">
                LIVE
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
              <span>Time: {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">{inProgressOrders.length} In Progress</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">{readyOrders.length} Ready for Pickup</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-zinc-800 text-xs flex items-center gap-2 ${
              soundEnabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Audio Alerts ON' : 'Audio Alerts MUTED'}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs"
          >
            <a href="/staff/menu">
              <Utensils className="h-4 w-4 mr-1 text-amber-400" />
              Menu Stock & 86 List
            </a>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 text-xs"
          >
            <a href="/staff/queue">
              Walk-in Queue
            </a>
          </Button>
        </div>
      </div>

      {/* Main KDS Board — Split View */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: ORDERS IN PROGRESS (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/90 border border-amber-500/20 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-amber-300 tracking-wide uppercase">
                Orders In Progress ({inProgressOrders.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-400">Sorted by oldest ticket first</span>
          </div>

          {inProgressOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
              <CheckCheck className="h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-lg font-bold text-zinc-200">Kitchen Queue Clean!</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                No pending or preparing orders right now. New customer tickets will pop up automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {inProgressOrders.map((order) => {
                const elapsed = formatElapsedTime(order.created_at, now)
                const isOverdue = elapsed.minutes >= 10
                const isUrgent = elapsed.minutes >= 20
                const isPreparing = order.status === 'preparing'

                return (
                  <Card
                    key={order.id}
                    className={`relative flex flex-col justify-between overflow-hidden transition-all border ${
                      isUrgent
                        ? 'border-red-500 bg-red-950/20 shadow-lg shadow-red-950/50'
                        : isOverdue
                        ? 'border-amber-500/60 bg-amber-950/20'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Top Order ID & Priority Header */}
                    <CardHeader className="p-4 pb-2 border-b border-zinc-800/80 bg-zinc-950/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black font-mono text-zinc-50">
                            #{order.id.slice(0, 8)}
                          </span>
                          {(order as any).table_number && (
                            <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs font-bold">
                              Table {(order as any).table_number}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isUrgent && (
                            <Badge className="bg-red-600 text-white font-black text-[10px] animate-pulse px-2 py-0.5">
                              URGENT
                            </Badge>
                          )}
                          <Badge
                            className={`font-bold text-xs capitalize ${
                              isPreparing
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                        <span className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-red-400' : 'text-zinc-400'}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {elapsed.text}
                        </span>
                        <span className="text-zinc-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </CardHeader>

                    {/* Order Items Body */}
                    <CardContent className="p-4 space-y-3 flex-1">
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-baseline justify-between text-base border-b border-zinc-800/40 pb-1.5">
                              <span className="font-bold text-zinc-100 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-300 text-xs font-black">
                                  {item.quantity}×
                                </span>
                                {item.menu_items?.name || `Dish #${item.id.slice(0, 4)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">No item summary details recorded.</p>
                      )}

                      {/* Special Notes / Allergy Alert */}
                      {order.notes && (
                        <div className="mt-2 rounded-xl border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-200 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-red-300 block">SPECIAL INSTRUCTIONS / ALLERGIES:</span>
                            {order.notes}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    {/* Action Footer */}
                    <div className="p-4 pt-2 border-t border-zinc-800 bg-zinc-950/40">
                      {order.status === 'pending' ? (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          disabled={updatingId === order.id}
                          className="w-full bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-5 text-sm flex items-center justify-center gap-2"
                        >
                          {updatingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Flame className="h-4 w-4" />
                              START PREP
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          disabled={updatingId === order.id}
                          className="w-full bg-sky-600 text-white hover:bg-sky-500 font-bold py-5 text-sm flex items-center justify-center gap-2"
                        >
                          {updatingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              MARK READY FOR PICKUP
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: READY FOR PICKUP (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/90 border border-emerald-500/20 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-emerald-300 tracking-wide uppercase">
                Ready For Pickup ({readyOrders.length})
              </h2>
            </div>
            <span className="text-xs text-zinc-400">Pass counter</span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400 text-xs">
              No orders waiting for pickup right now.
            </div>
          ) : (
            <div className="space-y-3">
              {readyOrders.map((order) => {
                const elapsed = formatElapsedTime(order.created_at, now)
                const isStaleReady = elapsed.minutes >= 15

                return (
                  <Card
                    key={order.id}
                    className={`border transition-all ${
                      isStaleReady ? 'border-amber-500/60 bg-amber-950/20' : 'border-emerald-500/30 bg-zinc-900/90'
                    }`}
                  >
                    <CardHeader className="p-3.5 pb-2 border-b border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black font-mono text-zinc-100">
                          #{order.id.slice(0, 8)}
                        </span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                          READY
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
                        <span className={`font-semibold ${isStaleReady ? 'text-amber-400' : 'text-zinc-400'}`}>
                          Ready {elapsed.text}
                        </span>
                        <span>{(order as any).table_number ? `Table ${(order as any).table_number}` : 'Walk-in'}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="p-3.5 text-xs text-zinc-300 space-y-1">
                      {order.order_items?.map((item) => (
                        <p key={item.id} className="font-medium text-zinc-200">
                          {item.quantity}× {item.menu_items?.name || 'Item'}
                        </p>
                      ))}
                    </CardContent>

                    <div className="p-3.5 pt-0">
                      <Button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        disabled={updatingId === order.id}
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center gap-1.5 text-xs"
                      >
                        {updatingId === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCheck className="h-4 w-4" />
                            MARK COMPLETED
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
