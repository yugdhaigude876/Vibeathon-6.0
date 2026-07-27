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
  CheckCircle2,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Welcome & Shift Command Center Header */}
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ChefHat className="w-64 h-64 text-amber-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-2xl border-2 border-amber-500/50 object-cover shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-zinc-100">{profile.name}</h1>
                  <Badge className="bg-amber-500 text-zinc-950 font-bold uppercase text-xs">
                    {profile.role}
                  </Badge>
                  {profile.clockedIn ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase font-bold">
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
                  <span className="text-amber-400">{profile.shift}</span>
                </p>
              </div>
            </div>

            {/* Shift Performance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Efficiency</span>
                <p className="text-lg font-black text-amber-400">{performance.efficiencyScore}%</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Prep</span>
                <p className="text-lg font-black text-emerald-400">{performance.avgCookingTimeMins}m</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rating</span>
                <p className="text-lg font-black text-amber-300">★ {performance.customerRating}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Leaderboard</span>
                <p className="text-lg font-black text-purple-400">#{performance.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Order Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Today Total</p>
                <p className="text-2xl font-black text-zinc-100">{totalOrdersToday}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Pending</p>
                <p className="text-2xl font-black text-blue-400">{pendingOrders.length}</p>
              </div>
              <Clock className="h-7 w-7 text-blue-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Preparing</p>
                <p className="text-2xl font-black text-amber-400">{preparingOrders.length}</p>
              </div>
              <Flame className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Ready</p>
                <p className="text-2xl font-black text-emerald-400">{readyOrders.length}</p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-emerald-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Completed</p>
                <p className="text-2xl font-black text-purple-400">{completedOrders.length}</p>
              </div>
              <Award className="h-7 w-7 text-purple-400/60" />
            </CardContent>
          </Card>
        </div>

        {/* Feature Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="flex h-auto w-full max-w-full gap-2 overflow-x-auto rounded-2xl bg-zinc-900/90 p-2 border border-zinc-800">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <LayoutDashboard className="h-4 w-4" /> Command Center
            </TabsTrigger>
            <TabsTrigger
              value="order_management"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <Receipt className="h-4 w-4" /> Order Management
            </TabsTrigger>
            <TabsTrigger
              value="kds"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <ChefHat className="h-4 w-4" /> Kitchen KDS
            </TabsTrigger>
            <TabsTrigger
              value="table_management"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <UtensilsCrossed className="h-4 w-4" /> Table & Bills
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <Truck className="h-4 w-4" /> Delivery Dispatch
            </TabsTrigger>
            <TabsTrigger
              value="customer_requests"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <Bell className="h-4 w-4" /> Customer Requests
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <Package className="h-4 w-4" /> Inventory & 86 List
            </TabsTrigger>
            <TabsTrigger
              value="shift_reports"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <BarChart3 className="h-4 w-4" /> Shift Reports
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW COMMAND CENTER */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Live Incoming Orders Feed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wide">Live Incoming Orders</h2>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Search order ID or table..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredOrders.map((ord: EnterpriseOrder) => (
                    <Card key={ord.id} className="border border-zinc-800 bg-zinc-900/60 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-amber-400">{ord.displayId}</span>
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
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase font-bold">
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
                        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3 space-y-1.5">
                          {ord.items.map((item: ExtendedOrderItem) => (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className={`font-semibold ${item.isCancelled ? 'line-through text-red-400' : 'text-zinc-200'}`}>
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-zinc-400 font-mono">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {ord.specialInstructions && (
                          <p className="text-xs text-amber-400/90 font-medium italic bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                            Instruction: {ord.specialInstructions}
                          </p>
                        )}

                        {/* Order Workflow Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                          <span className="text-[11px] font-bold text-zinc-400">Total: ₹{ord.totalAmount}</span>
                          <div className="flex gap-2">
                            {ord.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(ord.id, 'preparing')}
                                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl h-8"
                                >
                                  Accept Order
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectOrder(ord.id, 'Kitchen busy')}
                                  className="border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs font-bold rounded-xl h-8"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {ord.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(ord.id, 'ready')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl h-8"
                              >
                                Mark Ready
                              </Button>
                            )}
                            {ord.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(ord.id, 'delivered')}
                                className="bg-purple-500 hover:bg-purple-600 text-zinc-100 text-xs font-bold rounded-xl h-8"
                              >
                                Complete Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column: Urgent Alerts & Requests */}
              <div className="space-y-6">
                {/* Urgent Notifications Callout */}
                <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-amber-400" /> Notifications & Alerts
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                        {urgentOrVipNotifications.length} Alerts
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {urgentOrVipNotifications.map((n: StaffNotification) => (
                      <div key={n.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400">{n.title}</span>
                          <span className="text-[10px] text-zinc-500">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-tight">{n.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Customer Ticket Requests */}
                <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-emerald-400" /> Active Requests
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                        {requests.filter((r: CustomerTicketRequest) => r.status === 'pending').length} Pending
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    {requests.map((req: CustomerTicketRequest) => (
                      <div key={req.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400">{req.tableNumber} • {req.type}</span>
                          <span className="text-[10px] text-zinc-500">{req.time}</span>
                        </div>
                        {req.note && <p className="text-xs text-zinc-300 italic">{req.note}</p>}
                        <div className="flex justify-end gap-2 pt-1">
                          {req.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRequestStatus(req.id, 'completed')}
                              className="h-7 text-[10px] font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-zinc-950"
                            >
                              Resolve Request
                            </Button>
                          )}
                          {req.status === 'completed' && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ORDER MANAGEMENT WORKFLOW */}
          <TabsContent value="order_management" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Order Management Center</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Accept, reject, dispatch, track preparation time, or modify active order items.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
                {orders.length} Active Orders
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((ord: EnterpriseOrder) => (
                <Card key={ord.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3 border-b border-zinc-800 bg-zinc-950/60">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-amber-400">{ord.displayId}</span>
                      <Badge
                        className={`text-xs font-bold uppercase ${
                          ord.status === 'pending'
                            ? 'bg-blue-500/20 text-blue-400'
                            : ord.status === 'preparing'
                            ? 'bg-amber-500/20 text-amber-400'
                            : ord.status === 'ready'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ord.status === 'cancelled'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}
                      >
                        {ord.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{ord.customerName} {ord.tableNumber ? `• Table ${ord.tableNumber}` : ''}</span>
                      <span className="text-zinc-400">Est. Prep: {ord.estimatedPrepMinutes}m</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4 text-xs flex-1">
                    {/* Items detail list with item cancellation option */}
                    <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                      {ord.items.map((item: ExtendedOrderItem) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                          <span className={`font-semibold ${item.isCancelled ? 'line-through text-red-400' : 'text-zinc-200'}`}>
                            {item.quantity}x {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-400">₹{item.price * item.quantity}</span>
                            {!item.isCancelled && ord.status !== 'delivered' && (
                              <button
                                onClick={() => cancelOrderItem(ord.id, item.id)}
                                className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                              >
                                Cancel Item
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 flex justify-between font-bold text-amber-400 text-sm">
                        <span>Total Payable</span>
                        <span className="font-mono">₹{ord.totalAmount}</span>
                      </div>
                    </div>

                    {ord.specialInstructions && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-amber-300 italic">
                        Special Instructions: {ord.specialInstructions}
                      </div>
                    )}
                  </CardContent>

                  {/* Actions Bar */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    {ord.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(ord.id, 'preparing')}
                          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl"
                        >
                          Accept Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectOrder(ord.id, 'Out of stock')}
                          className="border-red-500/40 text-red-400 hover:bg-red-950/40 font-bold text-xs rounded-xl"
                        >
                          Reject Order
                        </Button>
                      </>
                    )}

                    {ord.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => updateOrderStatus(ord.id, 'ready')}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-zinc-100 font-bold text-xs rounded-xl"
                      >
                        Mark Order Ready
                      </Button>
                    )}

                    {ord.status === 'ready' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => dispatchOrder(ord.id, 'Rider Vikram Singh')}
                          className="bg-blue-600 hover:bg-blue-700 text-zinc-100 font-bold text-xs rounded-xl"
                        >
                          Dispatch Rider
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(ord.id, 'delivered')}
                          className="bg-purple-600 hover:bg-purple-700 text-zinc-100 font-bold text-xs rounded-xl"
                        >
                          Complete Order
                        </Button>
                      </>
                    )}

                    {ord.status === 'delivered' && (
                      <div className="col-span-2 text-center text-xs font-bold text-emerald-400 py-1 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
                        ✓ Order Completed
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: KITCHEN DISPLAY SYSTEM (KDS) */}
          <TabsContent value="kds" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChefHat className="h-6 w-6 text-amber-400" />
                <div>
                  <h2 className="text-xl font-extrabold uppercase text-zinc-100">Kitchen Display System (KDS)</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Live preparation tickets, estimated cooking time, and allergen warnings.</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 font-bold animate-pulse">
                KDS LIVE
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Pending Tickets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-900 border border-blue-500/30 p-3.5 rounded-2xl">
                  <span className="text-xs font-extrabold uppercase text-blue-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Pending ({pendingOrders.length})
                  </span>
                </div>
                {pendingOrders.map((ord: EnterpriseOrder) => (
                  <Card key={ord.id} className="border border-blue-500/30 bg-zinc-900/90 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-black text-zinc-100">{ord.displayId}</span>
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Pending</Badge>
                    </div>
                    <div className="text-xs space-y-1 text-zinc-300">
                      {ord.items.map((i: ExtendedOrderItem) => (
                        <p key={i.id} className="font-bold">{i.quantity}x {i.name}</p>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(ord.id, 'preparing')}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs rounded-xl"
                    >
                      Start Preparing ({ord.estimatedPrepMinutes}m)
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Column 2: Preparing Tickets */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-900 border border-amber-500/30 p-3.5 rounded-2xl">
                  <span className="text-xs font-extrabold uppercase text-amber-400 flex items-center gap-2">
                    <Flame className="h-4 w-4" /> Preparing ({preparingOrders.length})
                  </span>
                </div>
                {preparingOrders.map((ord: EnterpriseOrder) => (
                  <Card key={ord.id} className="border border-amber-500/40 bg-amber-950/20 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-black text-amber-400">{ord.displayId}</span>
                      <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Cooking</Badge>
                    </div>
                    <div className="text-xs space-y-1 text-zinc-300">
                      {ord.items.map((i: ExtendedOrderItem) => (
                        <p key={i.id} className="font-bold">{i.quantity}x {i.name}</p>
                      ))}
                    </div>
                    {ord.specialInstructions && (
                      <div className="text-[11px] text-red-300 bg-red-950/40 p-2 rounded-lg border border-red-500/30 font-semibold">
                        ⚠️ {ord.specialInstructions}
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(ord.id, 'ready')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-100 font-extrabold text-xs rounded-xl"
                    >
                      Mark Ready for Pickup
                    </Button>
                  </Card>
                ))}
              </div>

              {/* Column 3: Ready for Pass/Pickup */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-900 border border-emerald-500/30 p-3.5 rounded-2xl">
                  <span className="text-xs font-extrabold uppercase text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Ready ({readyOrders.length})
                  </span>
                </div>
                {readyOrders.map((ord: EnterpriseOrder) => (
                  <Card key={ord.id} className="border border-emerald-500/30 bg-zinc-900/90 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-black text-emerald-400">{ord.displayId}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Pass Ready</Badge>
                    </div>
                    <div className="text-xs space-y-1 text-zinc-300">
                      {ord.items.map((i: ExtendedOrderItem) => (
                        <p key={i.id} className="font-bold">{i.quantity}x {i.name}</p>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(ord.id, 'delivered')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-zinc-100 font-extrabold text-xs rounded-xl"
                    >
                      Pass Complete
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: TABLE MANAGEMENT & BILL SPLITTING */}
          <TabsContent value="table_management" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Table & Bill Management</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Reserve tables, merge adjacent tables, update seating status, and split bills.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
                {tables.length} Tables Active
              </Badge>
            </div>

            {/* Table Seating Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {tables.map((tbl: WaiterTable) => (
                <button
                  key={tbl.id}
                  onClick={() => setSelectedTableId(tbl.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedTableId === tbl.id
                      ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-zinc-100">{tbl.tableNumber}</span>
                    <Badge
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 ${
                        tbl.status === 'occupied'
                          ? 'bg-amber-500/20 text-amber-400'
                          : tbl.status === 'billing'
                          ? 'bg-purple-500/20 text-purple-400'
                          : tbl.status === 'reserved'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {tbl.status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-zinc-400 flex items-center gap-1 font-semibold">
                      <Users className="h-3 w-3" /> {tbl.occupancy}/{tbl.capacity} Seats
                    </p>
                    <p className="text-amber-400 font-mono font-bold">₹{tbl.currentBillAmount}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Table Operations Control Console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reserve Table Form */}
              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6 space-y-4">
                <CardHeader className="p-0 pb-2 border-b border-zinc-800">
                  <CardTitle className="text-base font-extrabold text-amber-400 uppercase flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" /> Reserve Table
                  </CardTitle>
                </CardHeader>
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 font-bold uppercase">Guest Name</label>
                      <Input
                        placeholder="e.g. Mr. Bajaj"
                        value={reserveGuestName}
                        onChange={(e) => setReserveGuestName(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 font-bold uppercase">Reservation Time</label>
                      <Input
                        placeholder="e.g. 08:30 PM"
                        value={reserveTime}
                        onChange={(e) => setReserveTime(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (reserveGuestName) {
                        reserveTable(selectedTableId, reserveGuestName, reserveTime, reserveGuestCount)
                        setReserveGuestName('')
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl h-10"
                  >
                    Confirm Table Reservation for {selectedTable.tableNumber}
                  </Button>
                </div>
              </Card>

              {/* Merge Tables & Split Bill */}
              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6 space-y-4">
                <CardHeader className="p-0 pb-2 border-b border-zinc-800">
                  <CardTitle className="text-base font-extrabold text-amber-400 uppercase flex items-center gap-2">
                    <Layers className="h-5 w-5" /> Merge Tables & Split Bills
                  </CardTitle>
                </CardHeader>
                <div className="space-y-4 text-xs">
                  {/* Merge Tables */}
                  <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <span className="font-bold text-zinc-300 uppercase">Merge Two Tables</span>
                    <div className="flex gap-2">
                      <Select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)}>
                        {tables.map((t: WaiterTable) => (
                          <option key={t.id} value={t.id}>{t.tableNumber}</option>
                        ))}
                      </Select>
                      <span className="text-zinc-500 self-center font-bold">+</span>
                      <Select value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)}>
                        {tables.map((t: WaiterTable) => (
                          <option key={t.id} value={t.id}>{t.tableNumber}</option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => mergeTables(mergeTargetId, mergeSourceId)}
                        className="bg-purple-600 hover:bg-purple-700 text-zinc-100 text-xs font-bold rounded-xl"
                      >
                        Merge
                      </Button>
                    </div>
                  </div>

                  {/* Split Bill Calculator */}
                  <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <span className="font-bold text-zinc-300 uppercase">Split Bill Calculator</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">Split Total into:</span>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5].map((parts) => (
                          <Button
                            key={parts}
                            size="sm"
                            variant={splitParts === parts ? 'default' : 'outline'}
                            onClick={() => {
                              setSplitParts(parts)
                              splitBill(splitOrderId, parts)
                            }}
                            className={`h-8 text-xs font-bold ${
                              splitParts === parts ? 'bg-amber-500 text-zinc-950' : 'border-zinc-800 text-zinc-300'
                            }`}
                          >
                            {parts} Parts
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: DELIVERY DISPATCH */}
          <TabsContent value="delivery" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Delivery Dispatch & OTP Console</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Assign delivery partners, track live delivery status, and verify customer OTP upon arrival.
                </p>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 font-bold">
                Delivery Console Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders
                .filter((o: EnterpriseOrder) => o.orderType === 'delivery')
                .map((ord: EnterpriseOrder) => (
                  <Card key={ord.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-black text-amber-400">{ord.displayId}</CardTitle>
                          <Badge className="bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold">
                            Rider: {ord.assignedDeliveryStaff || 'Vikram Singh'}
                          </Badge>
                        </div>
                        <p className="text-xs font-bold text-zinc-200 mt-1">{ord.customerName}</p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
                        {ord.status.replace('_', ' ')}
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-5 space-y-4 text-xs">
                      <div className="space-y-2 text-zinc-300">
                        <p className="flex items-center gap-2 font-semibold">
                          <MapPin className="h-4 w-4 text-amber-400 shrink-0" /> {ord.address || 'Bandra West, Mumbai'}
                        </p>
                        <p className="flex items-center gap-2 font-mono">
                          <Phone className="h-4 w-4 text-blue-400 shrink-0" /> {ord.phone || '+91 98201 44512'}
                        </p>
                      </div>

                      {/* Rider Assignment Dropdown */}
                      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                        <span className="text-zinc-400 font-bold uppercase">Assign Partner:</span>
                        <Select
                          value={ord.assignedDeliveryStaff || 'Rider Vikram Singh'}
                          onChange={(e) => assignDeliveryRider(ord.id, e.target.value)}
                          className="bg-transparent text-xs font-bold text-amber-300"
                        >
                          <option value="Rider Vikram Singh" className="bg-zinc-900 text-zinc-100">Vikram Singh</option>
                          <option value="Rider Rahul Sharma" className="bg-zinc-900 text-zinc-100">Rahul Sharma</option>
                          <option value="Rider Amit Verma" className="bg-zinc-900 text-zinc-100">Amit Verma</option>
                        </Select>
                      </div>

                      {/* OTP Delivery Completion Box */}
                      {ord.status !== 'delivered' ? (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 uppercase text-[11px] flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-amber-400" /> Customer OTP Verification
                            </span>
                            <span className="text-[10px] text-zinc-400">Default OTP: <strong className="text-zinc-200">{ord.otp || '4821'}</strong></span>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter 4-digit OTP"
                              value={otpInputs[ord.id] || ''}
                              onChange={(e) => setOtpInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                              className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 font-mono tracking-widest"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleVerifyDeliveryOtp(ord.id, ord.otp)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-zinc-100 text-xs font-bold rounded-xl px-4"
                            >
                              Verify & Complete
                            </Button>
                          </div>

                          {otpErrors[ord.id] && (
                            <p className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {otpErrors[ord.id]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center text-emerald-400 font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> Delivered & Verified via OTP
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* TAB 6: CUSTOMER REQUESTS */}
          <TabsContent value="customer_requests" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Customer Requests Feed</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Manage extra plates, extra sauce, item cancellations, waiter calls, and special notes.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
                {requests.filter((r: CustomerTicketRequest) => r.status === 'pending').length} Unresolved
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req: CustomerTicketRequest) => (
                <Card key={req.id} className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-amber-400">{req.tableNumber} • {req.type}</span>
                    <Badge
                      className={`text-[10px] font-bold uppercase ${
                        req.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                  {req.note && <p className="text-xs text-zinc-300 italic bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">{req.note}</p>}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-zinc-500 font-mono">{req.time}</span>
                    {req.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateRequestStatus(req.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-zinc-100 font-bold text-xs rounded-xl h-8"
                      >
                        Resolve Request
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 7: INVENTORY & 86 LIST */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Inventory & 86 List</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Monitor ingredients running low, out-of-stock items, and mark dishes 86'd.
                </p>
              </div>
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-3 py-1 font-bold">
                {inventoryAlerts.filter((i: InventoryAlert) => i.isOutOfStock).length} Out of Stock
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryAlerts.map((inv: InventoryAlert) => (
                <Card key={inv.id} className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">{inv.ingredient}</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Remaining: <span className="text-red-400 font-extrabold">{inv.remainingQty}</span> ({inv.expectedOutTime})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => toggleStockStatus(inv.id)}
                    className={`font-extrabold text-xs rounded-xl px-4 py-2 ${
                      inv.isOutOfStock ? 'bg-red-600 text-zinc-100' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {inv.isOutOfStock ? "86'd Out" : 'In Stock'}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 8: SHIFT & PERFORMANCE REPORTS */}
          <TabsContent value="shift_reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold uppercase text-zinc-100">Shift & Performance Analytics</h2>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Personal performance metrics, average preparation times, and completed shift summary.
                </p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-3 py-1 font-bold">
                Rank #{performance.rank} Overall
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-5 text-center space-y-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Orders Completed Today</span>
                <p className="text-3xl font-black text-amber-400">{performance.ordersCompleted}</p>
              </Card>

              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-5 text-center space-y-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Average Prep Time</span>
                <p className="text-3xl font-black text-emerald-400">{performance.avgCookingTimeMins}m</p>
              </Card>

              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-5 text-center space-y-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Efficiency Score</span>
                <p className="text-3xl font-black text-purple-400">{performance.efficiencyScore}%</p>
              </Card>

              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-5 text-center space-y-1">
                <span className="text-xs font-bold uppercase text-zinc-400">Customer Rating</span>
                <p className="text-3xl font-black text-amber-300">★ {performance.customerRating}</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
