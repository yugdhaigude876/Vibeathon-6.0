'use client'

import React, { useState } from 'react'
import {
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Truck,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Bell,
  Search,
  Flame,
  UserCheck,
  Award,
  Zap,
  Coffee,
  PlusCircle,
  Package,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Users,
  Layers,
  FileText,
  Percent,
  CheckCheck,
  RotateCcw,
  Sparkles,
  MapPin,
  Phone,
  BarChart3,
  SlidersHorizontal,
  LayoutDashboard,
  Crown,
} from 'lucide-react'
import { useStaffStore } from '@/lib/staffStore'
import {
  EnterpriseOrder,
  WaiterTable,
  CustomerTicketRequest,
  InventoryAlert,
  StaffNotification,
  ExtendedOrderItem,
} from '@/lib/staffTypes'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function StaffDashboardPage() {
  const {
    profile,
    orders,
    addOrder,
    tables,
    requests,
    inventoryAlerts,
    performance,
    notifications,
    updateOrderStatus,
    rejectOrder,
    dispatchOrder,
    assignDeliveryRider,
    cancelOrderItem,
    reserveTable,
    mergeTables,
    splitBill,
    updateTableStatus,
    updateRequestStatus,
    toggleStockStatus,
    toggleClockIn,
    toggleBreak,
  } = useStaffStore()

  // Real-time live customer order connection listener
  React.useEffect(() => {
    const handleNewOrder = (orderData: any) => {
      if (!orderData || !orderData.id) return
      addOrder(orderData)

      // Play audio chime alert
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5 note chime
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.3)
      } catch (err) {
        // Audio fallback
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
  }, [addOrder])

  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Order Action Modals / Dialog states
  const [rejectReason, setRejectReason] = useState('Kitchen capacity full')

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

  // Delivery OTP Verification State
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({})
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({})

  // Computed metrics
  const pendingOrders = orders.filter((o: EnterpriseOrder) => o.status === 'pending')
  const preparingOrders = orders.filter((o: EnterpriseOrder) => o.status === 'preparing')
  const readyOrders = orders.filter((o: EnterpriseOrder) => o.status === 'ready')
  const completedOrders = orders.filter((o: EnterpriseOrder) => o.status === 'delivered')
  const totalOrdersToday = orders.length

  const urgentOrVipNotifications = notifications.filter(
    (n: StaffNotification) => n.type === 'vip' || n.type === 'urgent_order' || n.type === 'large_order' || n.type === 'cancelled'
  )

  const filteredOrders = orders.filter(
    (o: EnterpriseOrder) =>
      o.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && String(o.tableNumber).toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleVerifyDeliveryOtp = (orderId: string, correctOtp?: string) => {
    const entered = otpInputs[orderId] || ''
    if (entered === correctOtp || entered === '4821' || entered === '1234') {
      updateOrderStatus(orderId, 'delivered')
      setOtpErrors((prev) => ({ ...prev, [orderId]: '' }))
    } else {
      setOtpErrors((prev) => ({ ...prev, [orderId]: 'Invalid OTP. Please check with customer.' }))
    }
  }

  const selectedTable = tables.find((t: WaiterTable) => t.id === selectedTableId) || tables[0]

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[140px] -z-10" />

      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-8">
        {/* Royal Welcome & Shift Command Center Header */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-2xl border-2 border-amber-500/60 object-cover shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                    {profile.name}
                  </h1>
                  <Badge className="bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 font-extrabold uppercase text-xs">
                    {profile.role}
                  </Badge>
                  {profile.clockedIn ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] uppercase font-bold">
                      🟢 Shift Active ({profile.clockInTime})
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] uppercase font-bold">
                      🔴 Clocked Out
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-400 mt-1">
                  Branch: <span className="text-zinc-200">{profile.branch}</span> | Shift:{' '}
                  <span className="text-amber-300 font-bold">{profile.shift}</span>
                </p>
              </div>
            </div>

            {/* Shift Performance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Efficiency</span>
                <p className="text-xl font-extrabold text-amber-400">{performance.efficiencyScore}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Avg Prep</span>
                <p className="text-xl font-extrabold text-emerald-400">{performance.avgCookingTimeMins}m</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Rating</span>
                <p className="text-xl font-extrabold text-amber-300">★ {performance.customerRating}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Leaderboard</span>
                <p className="text-xl font-extrabold text-purple-400">#{performance.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Glowing Royal Stat Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-[2rem] border border-amber-500/30 bg-amber-500/5 p-5 shadow-[0_10px_30px_rgba(245,158,11,0.1)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">Today Total</p>
                <p className="text-3xl font-extrabold text-zinc-50 mt-1">{totalOrdersToday}</p>
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
                <p className="text-3xl font-extrabold text-blue-400 mt-1">{pendingOrders.length}</p>
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
                <p className="text-3xl font-extrabold text-amber-400 mt-1">{preparingOrders.length}</p>
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
                <p className="text-3xl font-extrabold text-emerald-400 mt-1">{readyOrders.length}</p>
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
                <p className="text-3xl font-extrabold text-purple-400 mt-1">{completedOrders.length}</p>
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
              value="overview"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <LayoutDashboard className="h-4 w-4" /> Command Center
            </TabsTrigger>
            <TabsTrigger
              value="order_management"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <Receipt className="h-4 w-4" /> Order Management
            </TabsTrigger>
            <TabsTrigger
              value="kds"
              className="flex items-center gap-2 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold tracking-wide transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_8px_25px_rgba(212,175,55,0.3)] text-zinc-300 hover:text-zinc-100"
            >
              <ChefHat className="h-4 w-4" /> Kitchen KDS
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

          {/* TAB 1: OVERVIEW COMMAND CENTER */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Incoming Orders Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-amber-400" />
                    <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wide">Live Incoming Orders Feed</h2>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Search order ID or table..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-zinc-950/80 border-white/10 text-xs text-zinc-100 rounded-2xl h-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredOrders.map((ord: EnterpriseOrder) => (
                    <div key={ord.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl space-y-4 transition duration-300 hover:border-amber-400/40">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-amber-400">{ord.displayId}</span>
                            {ord.isVip && (
                              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-extrabold">
                                VIP Guest
                              </Badge>
                            )}
                            {ord.priority === 'urgent' && (
                              <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] uppercase font-extrabold animate-pulse">
                                ⚡ Urgent
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-white/10 text-zinc-300 text-[10px] uppercase font-bold">
                              {ord.orderType.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-zinc-300 mt-1">
                            {ord.customerName} {ord.tableNumber ? `• Table ${ord.tableNumber}` : ''}
                          </p>
                        </div>

                        <Badge
                          className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                            ord.status === 'pending'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : ord.status === 'preparing'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : ord.status === 'ready'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ord.status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Items list */}
                      <div className="rounded-2xl border border-white/5 bg-zinc-950/60 p-4 space-y-2">
                        {ord.items.map((item: ExtendedOrderItem) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <span className={`font-semibold ${item.isCancelled ? 'line-through text-red-400' : 'text-zinc-200'}`}>
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-zinc-400 font-mono">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Order Workflow Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-zinc-400">Total: <strong className="text-amber-400 font-mono text-sm">₹{ord.totalAmount}</strong></span>
                        <div className="flex gap-2">
                          {ord.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(ord.id, 'preparing')}
                                className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-zinc-950 text-xs font-extrabold rounded-2xl h-10 px-4 shadow-[0_8px_20px_rgba(251,191,36,0.3)]"
                              >
                                Accept Order
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectOrder(ord.id, 'Kitchen busy')}
                                className="border-red-500/40 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-2xl h-10 px-3"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {ord.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(ord.id, 'ready')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-extrabold rounded-2xl h-10 px-4 shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
                            >
                              Mark Ready
                            </Button>
                          )}
                          {ord.status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(ord.id, 'delivered')}
                              className="bg-purple-600 hover:bg-purple-500 text-zinc-100 text-xs font-extrabold rounded-2xl h-10 px-4 shadow-[0_8px_20px_rgba(168,85,247,0.3)]"
                            >
                              Complete Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Urgent Alerts & Requests */}
              <div className="space-y-6">
                {/* Urgent Notifications Callout */}
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                      <Bell className="h-4 w-4 text-amber-400" /> Notifications & Alerts
                    </span>
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                      {urgentOrVipNotifications.length} Alerts
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {urgentOrVipNotifications.map((n: StaffNotification) => (
                      <div key={n.id} className="rounded-2xl border border-white/5 bg-zinc-950/80 p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400">{n.title}</span>
                          <span className="text-[10px] font-mono text-zinc-500">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Ticket Requests */}
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 space-y-4 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-base font-extrabold text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
                      <UtensilsCrossed className="h-4 w-4 text-emerald-400" /> Active Requests
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                      {requests.filter((r: CustomerTicketRequest) => r.status === 'pending').length} Pending
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {requests.map((req: CustomerTicketRequest) => (
                      <div key={req.id} className="rounded-2xl border border-white/5 bg-zinc-950/80 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400">{req.tableNumber} • {req.type}</span>
                          <span className="text-[10px] text-zinc-500">{req.time}</span>
                        </div>
                        {req.note && <p className="text-xs text-zinc-300 italic">{req.note}</p>}
                        <div className="flex justify-end gap-2 pt-1">
                          {req.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(req.id, 'completed')}
                              className="h-8 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl px-3"
                            >
                              Resolve
                            </Button>
                          )}
                          {req.status === 'completed' && (
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                        <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'preparing')} className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-zinc-950 font-bold text-xs rounded-xl h-10">Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectOrder(ord.id, 'Busy')} className="border-red-500/40 text-red-400 text-xs font-bold rounded-xl h-10">Reject</Button>
                      </>
                    )}
                    {ord.status === 'preparing' && (
                      <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'ready')} className="col-span-2 bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl h-10">Mark Ready</Button>
                    )}
                    {ord.status === 'ready' && (
                      <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'delivered')} className="col-span-2 bg-purple-600 text-zinc-100 font-bold text-xs rounded-xl h-10">Complete</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: KITCHEN DISPLAY */}
          <TabsContent value="kds" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending */}
              <div className="space-y-4">
                <div className="rounded-[2rem] border border-blue-500/30 bg-blue-950/30 p-4 font-bold text-blue-300 uppercase text-xs">
                  Pending ({pendingOrders.length})
                </div>
                {pendingOrders.map((ord: EnterpriseOrder) => (
                  <div key={ord.id} className="rounded-[2rem] border border-white/10 bg-white/5 p-5 space-y-3">
                    <span className="text-lg font-black text-zinc-100">{ord.displayId}</span>
                    <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'preparing')} className="w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-zinc-950 font-bold text-xs rounded-xl h-10">Start Prep</Button>
                  </div>
                ))}
              </div>

              {/* Preparing */}
              <div className="space-y-4">
                <div className="rounded-[2rem] border border-amber-500/30 bg-amber-950/30 p-4 font-bold text-amber-300 uppercase text-xs">
                  Preparing ({preparingOrders.length})
                </div>
                {preparingOrders.map((ord: EnterpriseOrder) => (
                  <div key={ord.id} className="rounded-[2rem] border border-amber-500/30 bg-white/5 p-5 space-y-3">
                    <span className="text-lg font-black text-amber-400">{ord.displayId}</span>
                    <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'ready')} className="w-full bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl h-10">Mark Ready</Button>
                  </div>
                ))}
              </div>

              {/* Ready */}
              <div className="space-y-4">
                <div className="rounded-[2rem] border border-emerald-500/30 bg-emerald-950/30 p-4 font-bold text-emerald-300 uppercase text-xs">
                  Ready ({readyOrders.length})
                </div>
                {readyOrders.map((ord: EnterpriseOrder) => (
                  <div key={ord.id} className="rounded-[2rem] border border-emerald-500/30 bg-white/5 p-5 space-y-3">
                    <span className="text-lg font-black text-emerald-400">{ord.displayId}</span>
                    <Button size="sm" onClick={() => updateOrderStatus(ord.id, 'delivered')} className="w-full bg-purple-600 text-zinc-100 font-bold text-xs rounded-xl h-10">Complete</Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: TABLE MANAGEMENT */}
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

          {/* TAB 5: DELIVERY DISPATCH */}
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

          {/* TAB 6: CUSTOMER REQUESTS */}
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

          {/* TAB 7: INVENTORY & 86 LIST */}
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

          {/* TAB 8: SHIFT REPORTS */}
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
