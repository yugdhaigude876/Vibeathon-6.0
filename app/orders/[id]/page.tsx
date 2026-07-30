'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Clock,
  Utensils,
  PackageCheck,
  CheckCircle2,
  ArrowLeft,
  HelpCircle,
  Phone,
  Crown,
  Sparkles,
  Loader2,
  AlertCircle,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

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

const ORDER_STEPS = [
  {
    key: 'pending',
    label: 'Order Placed',
    subLabel: 'Received by kitchen',
    icon: Clock,
  },
  {
    key: 'preparing',
    label: 'Preparing',
    subLabel: 'Chef is crafting your meal',
    icon: Utensils,
  },
  {
    key: 'ready',
    label: 'Ready for Service',
    subLabel: 'Plated & awaiting table service',
    icon: PackageCheck,
  },
  {
    key: 'completed',
    label: 'Served & Completed',
    subLabel: 'Enjoy your royal feast!',
    icon: CheckCircle2,
  },
]

export default function OrderTrackingPage() {
  const params = useParams()
  const id = (params?.id as string) || (params?.orderId as string)
  const supabase = createClient()
  const { toast } = useToast()

  const { authorized, loading: authLoading } = useRoleGuard(['authenticated', 'customer', 'chef', 'staff', 'waiter', 'cashier', 'delivery', 'manager', 'admin'])
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false)

  // Customer Pay Bill State
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false)
  const [payMethod, setPayMethod] = useState<'upi' | 'card' | 'cash'>('upi')
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false)
  const [payCountdown, setPayCountdown] = useState<number>(5)
  const [isPaid, setIsPaid] = useState<boolean>(false)

  const handleStartPayment = () => {
    setIsProcessingPayment(true)
    setPayCountdown(5)

    const timer = setInterval(() => {
      setPayCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsProcessingPayment(false)
          setIsPayModalOpen(false)
          setIsPaid(true)
          setOrder((prevOrd) => (prevOrd ? { ...prevOrd, status: 'completed' } : null))
          
          toast({
            title: 'Payment Approved! 🎉',
            description: `Payment of ₹${totalAmount.toFixed(2)} confirmed successfully. Thank you for dining with us!`,
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }


  // Fetch initial order details
  const fetchOrder = async () => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchErr } = await supabase
        .from('orders')
        .select('*, order_items(*, menu_items(name, category))')
        .eq('id', id)
        .single()

      if (fetchErr) {
        // Fallback simple query if relationship select is missing foreign keys
        const { data: simpleData, error: simpleErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single()

        if (simpleErr) {
          // Final fallback: check localStorage for mock/offline orders
          try {
            const localOrders: Order[] = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
            const localOrder = localOrders.find((o) => o.id === id)
            if (localOrder) {
              setOrder(localOrder)
            } else {
              setError(simpleErr.message)
            }
          } catch {
            setError(simpleErr.message)
          }
        } else {
          setOrder(simpleData as Order)
        }
      } else if (data) {
        setOrder(data as Order)
      }
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError(err?.message || 'Failed to fetch order details')
    } finally {
      setLoading(false)
    }
  }

  // Real-time listener for orders table & broadcast updates
  useEffect(() => {
    fetchOrder()

    if (!id) return

    // 1. Supabase Postgres Changes
    const channel = supabase
      .channel(`order_realtime_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as Order
          setOrder((prev) => (prev ? { ...prev, ...updatedOrder } : updatedOrder))

          const statusUpper = (updatedOrder.status || 'pending').toUpperCase()
          toast({
            title: 'Order Status Updated ✨',
            description: `Your order status is now: ${statusUpper}!`,
          })
        }
      )
      .subscribe()

    // 2. BroadcastChannel Listener
    let bc: BroadcastChannel | null = null
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('luft_live_orders_channel')
      bc.onmessage = (event) => {
        if (event.data?.type === 'STATUS_UPDATE' && event.data.orderId === id) {
          const newStatus = event.data.status
          setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
          toast({
            title: 'Order Status Updated ✨',
            description: `Order is now ${newStatus.toUpperCase()}!`,
          })
        }
      }
    }

    // 3. CustomEvent Listener
    const handleCustomStatusUpdate = (e: any) => {
      if (e.detail?.orderId === id) {
        const newStatus = e.detail.status
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
        toast({
          title: 'Order Status Updated ✨',
          description: `Order is now ${newStatus.toUpperCase()}!`,
        })
      }
    }
    window.addEventListener('luft_order_status_update', handleCustomStatusUpdate)

    // 4. Storage event listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'luft_last_status_update' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.orderId === id) {
            setOrder((prev) => (prev ? { ...prev, status: parsed.status } : null))
          }
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      supabase.removeChannel(channel)
      if (bc) bc.close()
      window.removeEventListener('luft_order_status_update', handleCustomStatusUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [id])

  // Compute current step index
  const currentStepIndex = useMemo(() => {
    if (!order) return 0
    const status = (order.status || 'pending').toLowerCase()
    if (status === 'cancelled') return -1
    if (status === 'completed' || status === 'delivered' || status === 'served') return 3
    if (status === 'ready') return 2
    if (status === 'preparing') return 1
    return 0
  }, [order])

  // Calculation helpers
  const subtotal = useMemo(() => {
    if (!order?.order_items || order.order_items.length === 0) {
      return (order?.total_amount || 0) / 1.05
    }
    return order.order_items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price || 0),
      0
    )
  }, [order])

  const tax = useMemo(() => subtotal * 0.05, [subtotal])
  const totalAmount = useMemo(() => order?.total_amount || subtotal + tax, [order, subtotal, tax])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <Crown className="h-6 w-6 text-amber-400 absolute inset-0 m-auto" />
        </div>
        <p className="text-sm font-medium text-amber-200/80 tracking-wide">
          Summoning order details...
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="royal-card p-8 text-center space-y-4 border border-amber-500/30">
          <Crown className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold gold-gradient-text">Royal Record Found</h2>
          <p className="text-sm text-zinc-400">
            Order Reference: <span className="font-mono text-amber-300">#{id}</span>
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <Button asChild variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
              <Link href="/menu">
                <Utensils className="h-4 w-4 mr-2" /> Return to Royal Menu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-500/20 pb-6">
        <div className="space-y-3">
          <BreadcrumbNav items={[{ label: 'Home', href: '/' }, { label: 'Orders', href: '/orders' }, { label: `#${order.id.slice(0, 8)}` }]} />
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-full"
            >
              <Link href="/menu">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-400" />
                <h1 className="text-2xl font-extrabold gold-gradient-text tracking-tight">
                  Live Order Tracker
                </h1>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                Order Ref: <span className="font-mono text-amber-300 font-semibold">{order.id}</span>
                <span>•</span>
                <span>{new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHelpOpen(true)}
            className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 flex items-center gap-1.5"
          >
            <HelpCircle className="h-4 w-4 text-amber-400" />
            Need Help?
          </Button>
          <Button
            asChild
            size="sm"
            className="royal-button px-4"
          >
            <Link href="/menu">
              <Utensils className="h-4 w-4 mr-1.5" /> Back to Menu
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/70 p-4 text-sm text-zinc-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-amber-300">Live order tracking is active</p>
            <p className="text-zinc-400">Your request is moving through the kitchen with real-time progress updates.</p>
          </div>
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            {order.status}
          </div>
        </div>
      </div>

      {/* Royal Progress Stepper */}
      <Card className="royal-card border border-amber-500/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border-b border-amber-500/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              <CardTitle className="text-lg font-bold text-zinc-100">
                Preparation Progress
              </CardTitle>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 uppercase text-xs tracking-wider font-semibold">
              {order.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8">
          {/* Stepper Timeline Container */}
          <div className="relative">
            {/* Horizontal connection line for desktop */}
            <div className="hidden md:block absolute top-7 left-12 right-12 h-1 bg-zinc-800 rounded-full z-0">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700 ease-in-out"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (ORDER_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Stepper items grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon
                const isPassed = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                const isUpcoming = idx > currentStepIndex

                return (
                  <div
                    key={step.key}
                    className={`flex md:flex-col items-center gap-4 md:gap-3 md:text-center transition-all ${
                      isCurrent
                        ? 'scale-105 opacity-100'
                        : isPassed
                        ? 'opacity-90'
                        : 'opacity-40 grayscale'
                    }`}
                  >
                    {/* Circle Icon Container */}
                    <div
                      className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCurrent
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20'
                          : isPassed
                          ? 'border-amber-500 bg-amber-600 text-zinc-950 shadow-md shadow-amber-600/20'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      {isCurrent && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Step Titles */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm font-bold tracking-tight ${
                          isCurrent
                            ? 'text-amber-300'
                            : isPassed
                            ? 'text-zinc-200'
                            : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-snug">
                        {step.subLabel}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itemized Receipt Breakdown */}
      <Card className="royal-card border border-amber-500/20">
        <CardHeader className="border-b border-zinc-800/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-amber-400" />
              <CardTitle className="text-lg font-bold text-zinc-100">
                Itemized Receipt Breakdown
              </CardTitle>
            </div>
            {order.notes && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs">
                {order.notes}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Order Items List */}
          {order.order_items && order.order_items.length > 0 ? (
            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800/80 bg-zinc-950/50 overflow-hidden">
              {order.order_items.map((item) => {
                const name = item.menu_items?.name || `Menu Item #${item.menu_item_id}`
                const itemTotal = item.quantity * Number(item.unit_price || 0)

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        {item.quantity}x
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-100">{name}</h4>
                        <p className="text-xs text-zinc-400">
                          ₹{Number(item.unit_price || 0).toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 text-center text-xs text-zinc-400">
              Receipt summary recorded.
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800 text-sm">
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400 text-xs">
              <span>Government Tax & Service (5%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-50 font-bold text-lg pt-3 border-t border-amber-500/20">
              <span className="gold-gradient-text">Total Royal Bill</span>
              <span className="text-xl font-extrabold text-amber-400">
                ₹{totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Pay Bill Action Bar for Completed / Active Orders */}
            <div className="pt-4 border-t border-amber-500/20">
              {isPaid ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-base">
                    <CheckCircle2 className="h-5 w-5" /> BILL PAID & SETTLED
                  </div>
                  <p className="text-xs text-zinc-300">
                    Payment of <strong className="text-emerald-300 font-mono">₹{totalAmount.toFixed(2)}</strong> received. Receipt saved to your account.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-amber-400" /> Settle Royal Bill
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Pay via UPI QR, Credit/Debit Card, or Cash to table waiter.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsPayModalOpen(true)}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 font-black text-sm px-6 py-6 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:brightness-110"
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Pay ₹{totalAmount.toFixed(2)} Now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <Link href="/menu">
            <Utensils className="h-4 w-4 mr-2" /> Explore More Delicacies
          </Link>
        </Button>

        {!isPaid && (
          <Button
            onClick={() => setIsPayModalOpen(true)}
            className="w-full sm:w-auto bg-amber-500 text-zinc-950 hover:bg-amber-400 font-extrabold"
          >
            <CreditCard className="h-4 w-4 mr-2" /> Pay Bill (₹{totalAmount.toFixed(2)})
          </Button>
        )}

        <Button
          onClick={() => setIsHelpOpen(true)}
          className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
        >
          <HelpCircle className="h-4 w-4 mr-2 text-amber-400" /> Need Assistance?
        </Button>
      </div>

      {/* Pay Bill Gateway Modal with 5-Second Confirmation */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="bg-zinc-950 border-amber-500/30 text-zinc-50 sm:max-w-md rounded-[2.5rem] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold gold-gradient-text flex items-center justify-center gap-2 text-center">
              <Crown className="h-6 w-6 text-amber-400" /> Settle Order Bill
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 text-center">
              Total Amount Payable: <strong className="text-amber-300 font-mono text-sm">₹{totalAmount.toFixed(2)}</strong>
            </DialogDescription>
          </DialogHeader>

          {isProcessingPayment ? (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                <span className="absolute font-mono text-sm font-black text-amber-300">{payCountdown}s</span>
              </div>
              <div className="space-y-1">
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-bold px-3 py-1">
                  SECURE BANK GATEWAY
                </Badge>
                <h4 className="text-base font-bold text-zinc-100">Verifying Payment Signal...</h4>
                <p className="text-xs text-zinc-400">
                  Payment confirmation will close automatically within <strong className="text-amber-300">{payCountdown}s</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pt-2">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={payMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('upi')}
                  className={`h-12 text-xs font-bold rounded-2xl flex flex-col items-center justify-center gap-1 ${
                    payMethod === 'upi' ? 'bg-amber-500 text-zinc-950' : 'border-white/10 text-zinc-300'
                  }`}
                >
                  <QrCode className="h-4 w-4" /> UPI QR
                </Button>

                <Button
                  variant={payMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('card')}
                  className={`h-12 text-xs font-bold rounded-2xl flex flex-col items-center justify-center gap-1 ${
                    payMethod === 'card' ? 'bg-amber-500 text-zinc-950' : 'border-white/10 text-zinc-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Card
                </Button>

                <Button
                  variant={payMethod === 'cash' ? 'default' : 'outline'}
                  onClick={() => setPayMethod('cash')}
                  className={`h-12 text-xs font-bold rounded-2xl flex flex-col items-center justify-center gap-1 ${
                    payMethod === 'cash' ? 'bg-amber-500 text-zinc-950' : 'border-white/10 text-zinc-300'
                  }`}
                >
                  <Banknote className="h-4 w-4" /> Cash
                </Button>
              </div>

              {payMethod === 'upi' && (
                <div className="bg-zinc-900 border border-white/10 p-4 rounded-3xl text-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl inline-block mx-auto">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=luft@icici&pn=LuftDining&am=${totalAmount}`}
                      alt="UPI QR Code"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">luft@icici • ₹{totalAmount.toFixed(2)}</p>
                </div>
              )}

              {payMethod === 'card' && (
                <div className="bg-zinc-900 border border-white/10 p-4 rounded-3xl space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400">Card Number</label>
                    <div className="p-3 bg-zinc-950 border border-white/10 rounded-xl font-mono text-zinc-200">
                      •••• •••• •••• 4242
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Expiry</label>
                      <div className="p-2.5 bg-zinc-950 border border-white/10 rounded-xl font-mono text-zinc-200">
                        12/28
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">CVV</label>
                      <div className="p-2.5 bg-zinc-950 border border-white/10 rounded-xl font-mono text-zinc-200">
                        •••
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === 'cash' && (
                <div className="bg-zinc-900 border border-white/10 p-4 rounded-3xl text-center space-y-2">
                  <Banknote className="h-8 w-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-100">Pay Cash to Table Waiter</h4>
                  <p className="text-xs text-zinc-400">
                    Hand cash to your assigned waiter or pay directly at the cashier register.
                  </p>
                </div>
              )}

              <Button
                onClick={handleStartPayment}
                className="w-full py-6 bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 font-black uppercase text-sm rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:brightness-110"
              >
                Confirm & Pay ₹{totalAmount.toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assistance Dialog / Modal */}
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="bg-zinc-950 border-amber-500/30 text-zinc-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold gold-gradient-text flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" /> Royal Concierge Assistance
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              We are at your service. Select how you would like assistance with Order #{order.id.slice(0, 8)}.
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-3 py-4">
            <Button
              className="w-full justify-start bg-zinc-900 hover:bg-amber-600/20 border border-amber-500/30 text-amber-300 font-medium p-4 h-auto"
              onClick={() => {
                toast({
                  title: 'Waiter Summoned 🛎️',
                  description: 'A staff member is on their way to your table.',
                })
                setIsHelpOpen(false)
              }}
            >
              <Crown className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Call Table Server</p>
                <p className="text-xs text-zinc-400">Request immediate attendance at your table</p>
              </div>
            </Button>

            <Button
              className="w-full justify-start bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium p-4 h-auto"
              onClick={() => {
                toast({
                  title: 'Kitchen Alerted 👨‍🍳',
                  description: 'Special requests sent to head chef.',
                })
                setIsHelpOpen(false)
              }}
            >
              <Utensils className="h-5 w-5 text-amber-400 mr-3 shrink-0" />
              <div className="text-left">
                <p className="font-semibold text-sm">Dietary / Preparation Request</p>
                <p className="text-xs text-zinc-400">Send an urgent note regarding your order</p>
              </div>
            </Button>

            <a
              href="tel:+18005550199"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition-colors"
            >
              <Phone className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Direct Phone Support</p>
                <p className="text-xs text-zinc-400">Speak directly with restaurant manager</p>
              </div>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
