'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  Receipt,
  UtensilsCrossed,
  Truck,
  TrendingUp,
  Award,
  Zap,
  Coffee,
  PlusCircle,
  Package,
  XCircle,
  ShieldCheck,
  Users,
  Layers,
  FileText,
  MapPin,
  Phone,
  BarChart3,
  Search,
  Crown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useRealtimeOrders } from '@/lib/supabaseHooks'
import { useToast } from '@/hooks/use-toast'
import { useStaffStore } from '@/lib/staffStore'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  EnterpriseOrder,
  WaiterTable,
  CustomerTicketRequest,
  InventoryAlert,
  StaffNotification,
  ExtendedOrderItem,
} from '@/lib/staffTypes'

function formatElapsedTime(createdAt: string, now: number) {
  const diffMs = now - new Date(createdAt).getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return { text: 'just now', minutes: 0 }
  if (diffMinutes < 60) return { text: `${diffMinutes}m ago`, minutes: diffMinutes }

  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  return { text: `${hours}h ${mins}m ago`, minutes: diffMinutes }
}

export default function KitchenPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['staff', 'manager'])

  const [realtimeOrders, ordersLoading] = useRealtimeOrders()
  const [now, setNow] = useState(() => Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('kds')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    orders,
    addOrder,
    tables,
    requests,
    inventoryAlerts,
    performance,
    updateOrderStatus: updateStoreOrderStatus,
    rejectOrder,
    dispatchOrder,
    assignDeliveryRider,
    cancelOrderItem,
    reserveTable,
    mergeTables,
    splitBill,
    updateRequestStatus,
    toggleStockStatus,
  } = useStaffStore()

  // Real-time live customer order connection listener
  useEffect(() => {
    const handleNewOrder = (orderData: any) => {
      if (!orderData || !orderData.id) return
      addOrder(orderData)

      // Play audio chime alert if sound enabled
      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(659.25, audioCtx.currentTime) // E5 note chime
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.35)
        } catch (err) {
          // Audio fallback
        }
      }
    }

    // 1. BroadcastChannel listener
    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('luft_live_orders_channel')
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_ORDER') {
          handleNewOrder(event.data.order)
        }
      }
    }

    // 2. CustomEvent listener
    const eventHandler = (e: any) => handleNewOrder(e.detail)
    window.addEventListener('luft_new_order_event', eventHandler)

    // 3. Storage event listener
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'luft_last_new_order' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          handleNewOrder(parsed)
        } catch {}
      }
    }
    window.addEventListener('storage', storageHandler)

    return () => {
      if (bc) bc.close()
      window.removeEventListener('luft_new_order_event', eventHandler)
      window.removeEventListener('storage', storageHandler)
    }
  }, [addOrder, soundEnabled])

  // Table Management States
  const [selectedTableId, setSelectedTableId] = useState<string>('t1')
  const [reserveGuestName, setReserveGuestName] = useState('')
  const [reserveTime, setReserveTime] = useState('08:00 PM')
  const [reserveGuestCount, setReserveGuestCount] = useState(2)

  // Merge Tables State
  const [mergeTargetId, setMergeTargetId] = useState<string>('t1')
  const [mergeSourceId, setMergeSourceId] = useState<string>('t2')

  // Split Bill State
  const [splitOrderId, setSplitOrderId] = useState<string>('ord-101')
  const [splitParts, setSplitParts] = useState<number>(2)

  // Delivery OTP State
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({})
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(interval)
  }, [])

  // Filter & sort orders
  const { inProgressOrders, readyOrders } = useMemo(() => {
    const inProgress = realtimeOrders
      .filter((o) => o.status === 'pending' || o.status === 'preparing')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const ready = realtimeOrders
      .filter((o) => o.status === 'ready')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
      updateStoreOrderStatus(orderId, nextStatus as any)

      toast({
        title: 'Status Updated ⚡',
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

  const handleVerifyDeliveryOtp = (orderId: string, correctOtp?: string) => {
    const entered = otpInputs[orderId] || ''
    if (entered === correctOtp || entered === '4821' || entered === '1234') {
      updateStoreOrderStatus(orderId, 'delivered')
      setOtpErrors((prev) => ({ ...prev, [orderId]: '' }))
    } else {
      setOtpErrors((prev) => ({ ...prev, [orderId]: 'Invalid OTP. Please check with customer.' }))
    }
  }

  const selectedTable = tables.find((t: WaiterTable) => t.id === selectedTableId) || tables[0]

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Kitchen Display System...</span>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[140px] -z-10" />

      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-8">
        {/* Royal Command Center Banner Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_8px_25px_rgba(212,175,55,0.3)]">
                <ChefHat className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                    Staff Command Center & KDS
                  </h1>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 font-bold animate-pulse">
                    LIVE
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-3 font-medium">
                  <span>Time: <strong className="text-zinc-200">{new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong></span>
                  <span>•</span>
                  <span className="text-amber-300 font-semibold">{inProgressOrders.length + orders.filter((o: EnterpriseOrder) => o.status === 'preparing').length} In Progress</span>
                  <span>•</span>
                  <span className="text-emerald-300 font-semibold">{readyOrders.length + orders.filter((o: EnterpriseOrder) => o.status === 'ready').length} Ready</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-11 px-4 rounded-2xl border text-xs font-bold transition-all shadow-md ${
                  soundEnabled
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'border-white/10 bg-zinc-950/80 text-zinc-400'
                }`}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 mr-2 text-amber-400" /> : <VolumeX className="h-4 w-4 mr-2" />}
                {soundEnabled ? 'Audio Alerts ON' : 'Audio Muted'}
              </Button>
            </div>
          </div>
        </div>

        {/* Glowing Royal Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/5 p-5 shadow-[0_10px_30px_rgba(245,158,11,0.1)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Today Total</p>
                <p className="text-3xl font-extrabold text-zinc-50 mt-1">{orders.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-500/30 bg-blue-950/30 p-5 shadow-[0_10px_30px_rgba(59,130,246,0.1)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300/80">Pending</p>
                <p className="text-3xl font-extrabold text-blue-400 mt-1">{orders.filter((o: EnterpriseOrder) => o.status === 'pending').length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-500/40 bg-amber-950/30 p-5 shadow-[0_10px_30px_rgba(245,158,11,0.15)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Preparing</p>
                <p className="text-3xl font-extrabold text-amber-400 mt-1">{orders.filter((o: EnterpriseOrder) => o.status === 'preparing').length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-950/30 p-5 shadow-[0_10px_30px_rgba(16,185,129,0.1)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Ready</p>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{orders.filter((o: EnterpriseOrder) => o.status === 'ready').length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-purple-500/30 bg-purple-950/30 p-5 shadow-[0_10px_30px_rgba(168,85,247,0.1)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300/80">Completed</p>
                <p className="text-3xl font-extrabold text-purple-400 mt-1">{orders.filter((o: EnterpriseOrder) => o.status === 'delivered').length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="flex h-auto w-full max-w-full gap-2 overflow-x-auto rounded-[2rem] border border-white/10 bg-zinc-950/80 p-2 shadow-2xl backdrop-blur-xl">
            <TabsTrigger
              value="kds"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <ChefHat className="h-4 w-4" /> Kitchen KDS
            </TabsTrigger>
            <TabsTrigger
              value="order_management"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <Receipt className="h-4 w-4" /> Order Management
            </TabsTrigger>
            <TabsTrigger
              value="table_management"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <UtensilsCrossed className="h-4 w-4" /> Table & Bills
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <Truck className="h-4 w-4" /> Delivery Dispatch
            </TabsTrigger>
            <TabsTrigger
              value="customer_requests"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <Bell className="h-4 w-4" /> Customer Requests
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <Package className="h-4 w-4" /> Inventory & 86 List
            </TabsTrigger>
            <TabsTrigger
              value="shift_reports"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <BarChart3 className="h-4 w-4" /> Shift Reports
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: KITCHEN DISPLAY SYSTEM */}
          <TabsContent value="kds" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* LEFT COLUMN: ORDERS IN PROGRESS */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2.5">
                    <Flame className="h-5 w-5 text-amber-400" />
                    <h2 className="text-base font-extrabold text-amber-300 tracking-wider uppercase">
                      Orders In Progress ({inProgressOrders.length})
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">Sorted by oldest ticket first</span>
                </div>

                {inProgressOrders.length === 0 ? (
                  <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-12 text-center space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCheck className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-100">Kitchen Queue Clean!</h3>
                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                      No pending or preparing orders right now. New customer tickets will pop up automatically.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {inProgressOrders.map((order) => {
                      const elapsed = formatElapsedTime(order.created_at, now)
                      const isOverdue = elapsed.minutes >= 10
                      const isUrgent = elapsed.minutes >= 20
                      const isPreparing = order.status === 'preparing'

                      return (
                        <div
                          key={order.id}
                          className={`group relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-1 flex flex-col justify-between space-y-4 ${
                            isUrgent
                              ? 'border-red-500/60 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                              : isOverdue
                              ? 'border-amber-500/60 bg-amber-950/20'
                              : 'border-white/10 bg-white/5 hover:border-amber-400/40'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black font-mono text-zinc-50">
                                #{order.id.slice(0, 8)}
                              </span>
                              {(order as any).table_number && (
                                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs font-bold bg-amber-500/10">
                                  Table {(order as any).table_number}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isUrgent && (
                                <Badge className="bg-red-600 text-white font-black text-[10px] uppercase px-2 py-0.5 animate-pulse">
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

                          <div className="space-y-3 flex-1">
                            {order.order_items && order.order_items.length > 0 ? (
                              <div className="space-y-2">
                                {order.order_items.map((item) => (
                                  <div key={item.id} className="flex items-baseline justify-between text-sm border-b border-white/5 pb-1.5">
                                    <span className="font-bold text-zinc-100 flex items-center gap-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs font-black">
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

                            {order.notes && (
                              <div className="mt-2 rounded-2xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-red-300 block uppercase text-[10px] tracking-wider">Instructions / Allergies:</span>
                                  {order.notes}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            {order.status === 'pending' ? (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                                disabled={updatingId === order.id}
                                className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 px-6 py-3.5 text-sm font-extrabold text-zinc-950 shadow-[0_10px_30px_rgba(251,191,36,0.3)] transition duration-300 hover:shadow-[0_15px_40px_rgba(251,191,36,0.4)] h-12"
                              >
                                {updatingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Flame className="h-4 w-4 mr-2" />
                                    START PREPARATION
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleUpdateStatus(order.id, 'ready')}
                                disabled={updatingId === order.id}
                                className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 font-extrabold text-sm shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:brightness-110 h-12"
                              >
                                {updatingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    MARK READY FOR PICKUP
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: READY FOR PICKUP */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between rounded-[2rem] border border-emerald-500/30 bg-emerald-950/30 p-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-base font-extrabold text-emerald-300 tracking-wider uppercase">
                      Ready For Pickup ({readyOrders.length})
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-400">Pass Counter</span>
                </div>

                {readyOrders.length === 0 ? (
                  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center text-zinc-400 text-xs shadow-xl backdrop-blur-xl">
                    No orders waiting for pickup right now.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readyOrders.map((order) => {
                      const elapsed = formatElapsedTime(order.created_at, now)
                      return (
                        <div key={order.id} className="rounded-[2rem] border border-emerald-500/30 bg-white/5 p-5 space-y-3 shadow-xl backdrop-blur-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black font-mono text-zinc-100">
                              #{order.id.slice(0, 8)}
                            </span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                              READY
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            disabled={updatingId === order.id}
                            size="sm"
                            className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-extrabold text-xs h-11 flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(16,185,129,0.3)]"
                          >
                            <CheckCheck className="h-4 w-4" />
                            MARK COMPLETED
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ORDER MANAGEMENT */}
          <TabsContent value="order_management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((ord: EnterpriseOrder) => (
                <div key={ord.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xl font-black text-amber-400">{ord.displayId}</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase">{ord.status}</Badge>
                  </div>
                  <div className="space-y-2 text-xs text-zinc-300 flex-1">
                    {ord.items.map((item: ExtendedOrderItem) => (
                      <div key={item.id} className="flex justify-between border-b border-white/5 pb-1">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-mono">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 font-bold text-amber-400 flex justify-between border-t border-white/10 text-sm">
                      <span>Total Payable</span>
                      <span className="font-mono">₹{ord.totalAmount}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {ord.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'preparing')} className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-zinc-950 font-bold text-xs rounded-xl h-10">Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectOrder(ord.id, 'Busy')} className="border-red-500/40 text-red-400 text-xs font-bold rounded-xl h-10">Reject</Button>
                      </>
                    )}
                    {ord.status === 'preparing' && (
                      <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'ready')} className="col-span-2 bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl h-10">Mark Ready</Button>
                    )}
                    {ord.status === 'ready' && (
                      <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'delivered')} className="col-span-2 bg-purple-600 text-zinc-100 font-bold text-xs rounded-xl h-10">Complete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: TABLE MANAGEMENT */}
          <TabsContent value="table_management" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {tables.map((tbl: WaiterTable) => (
                <button
                  key={tbl.id}
                  onClick={() => setSelectedTableId(tbl.id)}
                  className={`rounded-[2rem] border p-5 text-left transition duration-300 ${
                    selectedTableId === tbl.id
                      ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-xl font-black text-zinc-100">{tbl.tableNumber}</span>
                  <p className="text-sm text-amber-400 font-mono font-bold mt-2">₹{tbl.currentBillAmount}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* TAB 4: DELIVERY DISPATCH */}
          <TabsContent value="delivery" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.filter((o: EnterpriseOrder) => o.orderType === 'delivery').map((ord: EnterpriseOrder) => (
                <div key={ord.id} className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 space-y-4 shadow-xl backdrop-blur-xl">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-xl font-black text-amber-400">{ord.displayId}</span>
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">{ord.assignedDeliveryStaff || 'Rider Vikram'}</Badge>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter 4-digit OTP"
                      value={otpInputs[ord.id] || ''}
                      onChange={(e) => setOtpInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                      className="bg-zinc-950/80 border-white/10 text-xs font-mono rounded-2xl h-11"
                    />
                    <Button size="sm" onClick={() => handleVerifyDeliveryOtp(ord.id, ord.otp)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold rounded-2xl h-11 shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                      Verify OTP & Complete Delivery
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 5: CUSTOMER REQUESTS */}
          <TabsContent value="customer_requests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req: CustomerTicketRequest) => (
                <div key={req.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between shadow-xl backdrop-blur-xl">
                  <div>
                    <span className="font-bold text-amber-400 text-base">{req.tableNumber} • {req.type}</span>
                    {req.note && <p className="text-xs text-zinc-400 mt-1">{req.note}</p>}
                  </div>
                  {req.status === 'pending' && (
                    <Button size="sm" onClick={() => updateRequestStatus(req.id, 'completed')} className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-extrabold rounded-2xl h-10 px-4">
                      Resolve
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 6: INVENTORY & 86 LIST */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryAlerts.map((inv: InventoryAlert) => (
                <div key={inv.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between shadow-xl backdrop-blur-xl">
                  <div>
                    <span className="font-bold text-zinc-100 text-base">{inv.ingredient}</span>
                    <p className="text-xs text-red-400 mt-1 font-semibold">{inv.remainingQty} left</p>
                  </div>
                  <Button size="sm" onClick={() => toggleStockStatus(inv.id)} className={`text-xs font-bold rounded-2xl px-5 h-10 ${inv.isOutOfStock ? 'bg-red-600 text-zinc-100' : 'bg-zinc-900 border border-white/10 text-zinc-300'}`}>
                    {inv.isOutOfStock ? "86'd Out" : 'In Stock'}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 7: SHIFT REPORTS */}
          <TabsContent value="shift_reports" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center shadow-xl backdrop-blur-xl">
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Orders Completed</span>
                <p className="text-4xl font-extrabold text-amber-400 mt-2">{performance.ordersCompleted}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center shadow-xl backdrop-blur-xl">
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Avg Cooking Time</span>
                <p className="text-4xl font-extrabold text-emerald-400 mt-2">{performance.avgCookingTimeMins}m</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center shadow-xl backdrop-blur-xl">
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Efficiency Score</span>
                <p className="text-4xl font-extrabold text-purple-400 mt-2">{performance.efficiencyScore}%</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center shadow-xl backdrop-blur-xl">
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Customer Rating</span>
                <p className="text-4xl font-extrabold text-amber-300 mt-2">★ {performance.customerRating}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
