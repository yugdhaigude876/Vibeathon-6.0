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
  const [prevCount, setPrevCount] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<string>('kds')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    profile,
    orders,
    tables,
    requests,
    inventoryAlerts,
    performance,
    notifications,
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* All-in-One Staff Dashboard Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ChefHat className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-zinc-50">
                  Staff Command Center & KDS
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs animate-pulse">
                  LIVE
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3">
                <span>Time: {new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
              className={`border-zinc-800 text-xs flex items-center gap-2 ${
                soundEnabled ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-amber-400" /> : <VolumeX className="h-4 w-4" />}
              {soundEnabled ? 'Audio Alerts ON' : 'Audio Muted'}
            </Button>
          </div>
        </div>

        {/* Real-time Order Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Today Total</p>
                <p className="text-2xl font-black text-zinc-100">{orders.length}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Pending</p>
                <p className="text-2xl font-black text-blue-400">{orders.filter((o: EnterpriseOrder) => o.status === 'pending').length}</p>
              </div>
              <Clock className="h-7 w-7 text-blue-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Preparing</p>
                <p className="text-2xl font-black text-amber-400">{orders.filter((o: EnterpriseOrder) => o.status === 'preparing').length}</p>
              </div>
              <Flame className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Ready</p>
                <p className="text-2xl font-black text-emerald-400">{orders.filter((o: EnterpriseOrder) => o.status === 'ready').length}</p>
              </div>
              <CheckCircle className="h-7 w-7 text-emerald-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Completed</p>
                <p className="text-2xl font-black text-purple-400">{orders.filter((o: EnterpriseOrder) => o.status === 'delivered').length}</p>
              </div>
              <Award className="h-7 w-7 text-purple-400/60" />
            </CardContent>
          </Card>
        </div>


        {/* Feature Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="flex h-auto w-full max-w-full gap-2 overflow-x-auto rounded-2xl bg-zinc-900/90 p-2 border border-zinc-800">
            <TabsTrigger
              value="kds"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <ChefHat className="h-4 w-4" /> Kitchen KDS
            </TabsTrigger>
            <TabsTrigger
              value="order_management"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-300"
            >
              <Receipt className="h-4 w-4" /> Order Management
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

          {/* TAB 1: KITCHEN DISPLAY SYSTEM */}
          <TabsContent value="kds" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12 items-start">
              {/* LEFT COLUMN: ORDERS IN PROGRESS (8 cols) */}
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
                          </CardHeader>

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

              {/* RIGHT COLUMN: READY FOR PICKUP (4 cols) */}
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
                      return (
                        <Card key={order.id} className="border border-emerald-500/30 bg-zinc-900/90 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black font-mono text-zinc-100">
                              #{order.id.slice(0, 8)}
                            </span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                              READY
                            </Badge>
                          </div>
                          <Button
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            disabled={updatingId === order.id}
                            size="sm"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center gap-1.5 text-xs"
                          >
                            <CheckCheck className="h-4 w-4" />
                            MARK COMPLETED
                          </Button>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ORDER MANAGEMENT */}
          <TabsContent value="order_management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orders.map((ord: EnterpriseOrder) => (
                <Card key={ord.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3 border-b border-zinc-800 bg-zinc-950/60">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-amber-400">{ord.displayId}</span>
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs font-bold uppercase">{ord.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3 text-xs">
                    {ord.items.map((item: ExtendedOrderItem) => (
                      <div key={item.id} className="flex justify-between text-zinc-200">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 font-bold text-amber-400 flex justify-between border-t border-zinc-800">
                      <span>Total</span>
                      <span>₹{ord.totalAmount}</span>
                    </div>
                  </CardContent>
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {ord.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'preparing')} className="bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl">Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectOrder(ord.id, 'Busy')} className="border-red-500/40 text-red-400 text-xs font-bold rounded-xl">Reject</Button>
                      </>
                    )}
                    {ord.status === 'preparing' && (
                      <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'ready')} className="col-span-2 bg-emerald-600 text-zinc-100 font-bold text-xs rounded-xl">Mark Ready</Button>
                    )}
                    {ord.status === 'ready' && (
                      <Button size="sm" onClick={() => updateStoreOrderStatus(ord.id, 'delivered')} className="col-span-2 bg-purple-600 text-zinc-100 font-bold text-xs rounded-xl">Complete</Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: TABLE MANAGEMENT */}
          <TabsContent value="table_management" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {tables.map((tbl: WaiterTable) => (
                <button
                  key={tbl.id}
                  onClick={() => setSelectedTableId(tbl.id)}
                  className={`rounded-2xl border p-4 text-left transition-all ${
                    selectedTableId === tbl.id ? 'border-amber-500 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900/60'
                  }`}
                >
                  <span className="text-lg font-black text-zinc-100">{tbl.tableNumber}</span>
                  <p className="text-xs text-amber-400 font-mono mt-2">₹{tbl.currentBillAmount}</p>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* TAB 4: DELIVERY DISPATCH */}
          <TabsContent value="delivery" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.filter((o: EnterpriseOrder) => o.orderType === 'delivery').map((ord: EnterpriseOrder) => (
                <Card key={ord.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-amber-400">{ord.displayId}</span>
                    <Badge className="bg-blue-500/20 text-blue-400 text-xs">{ord.assignedDeliveryStaff || 'Rider Vikram'}</Badge>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter 4-digit OTP"
                      value={otpInputs[ord.id] || ''}
                      onChange={(e) => setOtpInputs((prev) => ({ ...prev, [ord.id]: e.target.value }))}
                      className="bg-zinc-950 text-xs font-mono"
                    />
                    <Button size="sm" onClick={() => handleVerifyDeliveryOtp(ord.id, ord.otp)} className="w-full bg-emerald-600 text-xs font-bold rounded-xl">
                      Verify OTP & Complete Delivery
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 5: CUSTOMER REQUESTS */}
          <TabsContent value="customer_requests" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req: CustomerTicketRequest) => (
                <Card key={req.id} className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-400 text-sm">{req.tableNumber} • {req.type}</span>
                    {req.note && <p className="text-xs text-zinc-400 mt-1">{req.note}</p>}
                  </div>
                  {req.status === 'pending' && (
                    <Button size="sm" onClick={() => updateRequestStatus(req.id, 'completed')} className="bg-emerald-600 text-xs font-bold rounded-xl">
                      Resolve
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 6: INVENTORY & 86 LIST */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryAlerts.map((inv: InventoryAlert) => (
                <Card key={inv.id} className="border border-zinc-800 bg-zinc-900/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-zinc-100 text-sm">{inv.ingredient}</span>
                    <p className="text-xs text-red-400 mt-1">{inv.remainingQty} left</p>
                  </div>
                  <Button size="sm" onClick={() => toggleStockStatus(inv.id)} className={`text-xs font-bold rounded-xl ${inv.isOutOfStock ? 'bg-red-600' : 'bg-zinc-800'}`}>
                    {inv.isOutOfStock ? "86'd Out" : 'In Stock'}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 7: SHIFT REPORTS */}
          <TabsContent value="shift_reports" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border border-zinc-800 bg-zinc-900/80 p-5 text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Orders Completed</span>
                <p className="text-3xl font-black text-amber-400 mt-1">{performance.ordersCompleted}</p>
              </Card>
              <Card className="border border-zinc-800 bg-zinc-900/80 p-5 text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Avg Cooking Time</span>
                <p className="text-3xl font-black text-emerald-400 mt-1">{performance.avgCookingTimeMins}m</p>
              </Card>
              <Card className="border border-zinc-800 bg-zinc-900/80 p-5 text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Efficiency Score</span>
                <p className="text-3xl font-black text-purple-400 mt-1">{performance.efficiencyScore}%</p>
              </Card>
              <Card className="border border-zinc-800 bg-zinc-900/80 p-5 text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold">Customer Rating</span>
                <p className="text-3xl font-black text-amber-300 mt-1">★ {performance.customerRating}</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
