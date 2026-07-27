'use client'

import React, { useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { useStaffStore } from '@/lib/staffStore'
import { EnterpriseOrder, ExtendedOrderItem } from '@/lib/staffTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Printer,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  DollarSign,
  Zap,
  Calculator,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react'

export default function CashierPage() {
  const { orders, updateOrderStatus } = useStaffStore()
  const [selectedOrder, setSelectedOrder] = useState<EnterpriseOrder | null>(orders[0] || null)

  // Discounts & Coupons
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [couponCode, setCouponCode] = useState<string>('')
  const [couponApplied, setCouponApplied] = useState<boolean>(false)

  // Tip Calculator
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [customTipAmount, setCustomTipAmount] = useState<number>(0)

  // Single vs Split Payment Mode
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false)
  const [singlePaymentMethod, setSinglePaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Loyalty'>('UPI')

  // Split Payment Allocations
  const [splitCash, setSplitCash] = useState<number>(0)
  const [splitCard, setSplitCard] = useState<number>(0)
  const [splitUpi, setSplitUpi] = useState<number>(0)
  const [splitLoyaltyPoints, setSplitLoyaltyPoints] = useState<number>(0) // 1 PT = ₹1

  // Cash Tendered & Change Due
  const [cashTendered, setCashTendered] = useState<number>(0)

  // Status
  const [billPaid, setBillPaid] = useState<boolean>(false)
  const [showQrModal, setShowQrModal] = useState<boolean>(false)

  // Financial calculations
  const rawTotal = selectedOrder ? selectedOrder.totalAmount : 0
  const discountAmount = Math.round((rawTotal * discountPercent) / 100)
  const afterDiscount = rawTotal - discountAmount
  const gstAmount = Math.round(afterDiscount * 0.05) // 5% GST
  const tipAmount = tipPercent > 0 ? Math.round((afterDiscount * tipPercent) / 100) : customTipAmount
  const loyaltyDiscount = splitLoyaltyPoints // 1 point = 1 rupee discount

  const finalPayable = Math.max(0, afterDiscount + gstAmount + tipAmount - loyaltyDiscount)

  // Split payment total allocated
  const allocatedTotal = isSplitPayment ? splitCash + splitCard + splitUpi + splitLoyaltyPoints : finalPayable
  const remainingBalance = Math.max(0, finalPayable - (isSplitPayment ? splitCash + splitCard + splitUpi + splitLoyaltyPoints : 0))
  const changeDue = Math.max(0, cashTendered - (isSplitPayment ? splitCash : finalPayable))

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'LUFT10') {
      setDiscountPercent(10)
      setCouponApplied(true)
    } else if (couponCode.toUpperCase() === 'ROYAL20') {
      setDiscountPercent(20)
      setCouponApplied(true)
    }
  }

  const handleCompletePayment = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'delivered')
      setBillPaid(true)
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-purple-500/10 rounded-full blur-[140px] -z-10" />

      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-200 via-purple-400 to-amber-300 bg-clip-text text-transparent">
                Cashier POS & Multi-Payment Register
              </h1>
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-3 py-1 font-bold">
                REGISTER ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Touchscreen checkout panel with quick bill print, tip calculator, and multi-split payments (Cash, Card, UPI QR, Loyalty Points).
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 text-xs font-bold rounded-2xl h-11 px-4"
            >
              <Printer className="mr-2 h-4 w-4 text-purple-400" /> Print Receipt
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 4 COLS: Active Unpaid Orders List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 flex items-center justify-between backdrop-blur-xl">
              <span className="text-xs font-extrabold uppercase text-purple-300 tracking-wider">Unpaid Orders ({orders.length})</span>
            </div>

            <div className="space-y-3">
              {orders.map((ord: EnterpriseOrder) => (
                <button
                  key={ord.id}
                  onClick={() => {
                    setSelectedOrder(ord)
                    setBillPaid(false)
                    setCashTendered(0)
                    setSplitCash(0)
                    setSplitCard(0)
                    setSplitUpi(0)
                    setSplitLoyaltyPoints(0)
                  }}
                  className={`w-full text-left rounded-[2rem] border p-5 transition-all duration-300 ${
                    selectedOrder?.id === ord.id
                      ? 'border-purple-500 bg-purple-950/30 shadow-[0_0_25px_rgba(168,85,247,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-amber-400">{ord.displayId}</span>
                    <Badge variant="outline" className="border-white/10 text-zinc-300 text-[10px] font-bold uppercase">
                      {ord.orderType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">{ord.customerName} {ord.tableNumber ? `• Table ${ord.tableNumber}` : ''}</span>
                    <span className="text-amber-400 font-mono font-black text-sm">₹{ord.totalAmount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT 8 COLS: Interactive Touchscreen Cashier Register Panel */}
          {selectedOrder ? (
            <div className="lg:col-span-8 space-y-6">
              <Card className="border border-white/10 bg-white/5 rounded-[2.5rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl space-y-6">
                {/* Invoice Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-zinc-100 flex items-center gap-2">
                      <Receipt className="h-6 w-6 text-purple-400" /> Bill Receipt — {selectedOrder.displayId}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 font-semibold">
                      Customer: <strong className="text-zinc-200">{selectedOrder.customerName}</strong> {selectedOrder.tableNumber ? `• Table ${selectedOrder.tableNumber}` : ''}
                    </p>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-3 py-1 font-bold self-start sm:self-center">
                    TAX INVOICE
                  </Badge>
                </div>

                {/* Items Breakdown List */}
                <div className="rounded-2xl border border-white/5 bg-zinc-950/80 p-4 space-y-2 text-xs">
                  {selectedOrder.items.map((item: ExtendedOrderItem) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-semibold text-zinc-200">{item.quantity}x {item.name}</span>
                      <span className="font-mono text-zinc-300">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Coupons & Tip Calculator Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Coupon Application */}
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400">Coupon Discount</label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="e.g. LUFT10 or ROYAL20"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="bg-zinc-950 border-white/10 text-xs text-zinc-100 uppercase"
                      />
                      <Button size="sm" onClick={handleApplyCoupon} className="bg-purple-600 hover:bg-purple-500 text-xs font-bold rounded-xl px-4">
                        Apply
                      </Button>
                    </div>
                    {couponApplied && <p className="text-[10px] font-bold text-emerald-400">✓ Coupon applied! {discountPercent}% discount added.</p>}
                  </div>

                  {/* Tip Calculator */}
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-400">Staff Tip Calculator</label>
                    <div className="flex gap-1.5">
                      {[0, 5, 10, 15].map((pct) => (
                        <Button
                          key={pct}
                          size="sm"
                          variant={tipPercent === pct && customTipAmount === 0 ? 'default' : 'outline'}
                          onClick={() => {
                            setTipPercent(pct)
                            setCustomTipAmount(0)
                          }}
                          className={`flex-1 text-xs font-bold rounded-xl h-9 ${
                            tipPercent === pct && customTipAmount === 0 ? 'bg-amber-500 text-zinc-950' : 'border-white/10 text-zinc-300'
                          }`}
                        >
                          {pct === 0 ? 'No Tip' : `${pct}%`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Single vs Multi-Split Payment Mode Selector */}
                <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-purple-300 flex items-center gap-2">
                      <Calculator className="h-4 w-4" /> Payment Mode Configuration
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={!isSplitPayment ? 'default' : 'outline'}
                        onClick={() => setIsSplitPayment(false)}
                        className={`text-xs font-bold rounded-xl h-8 ${!isSplitPayment ? 'bg-purple-600 text-zinc-100' : 'border-white/10 text-zinc-400'}`}
                      >
                        Single Mode
                      </Button>
                      <Button
                        size="sm"
                        variant={isSplitPayment ? 'default' : 'outline'}
                        onClick={() => setIsSplitPayment(true)}
                        className={`text-xs font-bold rounded-xl h-8 ${isSplitPayment ? 'bg-amber-500 text-zinc-950 font-black' : 'border-white/10 text-zinc-400'}`}
                      >
                        Multi-Split Mode ⚡
                      </Button>
                    </div>
                  </div>

                  {!isSplitPayment ? (
                    /* Single Payment Mode Options */
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { method: 'UPI', icon: QrCode },
                        { method: 'Card', icon: CreditCard },
                        { method: 'Cash', icon: Banknote },
                        { method: 'Loyalty', icon: Award },
                      ].map(({ method, icon: Icon }) => (
                        <Button
                          key={method}
                          variant={singlePaymentMethod === method ? 'default' : 'outline'}
                          onClick={() => {
                            setSinglePaymentMethod(method as any)
                            if (method === 'UPI') setShowQrModal(true)
                          }}
                          className={`h-12 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 ${
                            singlePaymentMethod === method
                              ? 'bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_4px_15px_rgba(212,175,55,0.3)]'
                              : 'border-white/10 bg-white/5 text-zinc-300'
                          }`}
                        >
                          <Icon className="h-4 w-4" /> {method}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    /* Multi-Split Payment Controls */
                    <div className="space-y-3">
                      <p className="text-[11px] font-semibold text-zinc-300">
                        Allocate exact payment split across Cash, Credit Card, UPI QR, and Loyalty Points:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-zinc-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <Banknote className="h-3.5 w-3.5 text-emerald-400" /> Cash (₹)
                          </label>
                          <Input
                            type="number"
                            value={splitCash || ''}
                            onChange={(e) => setSplitCash(Number(e.target.value))}
                            className="bg-zinc-950 border-white/10 text-xs text-zinc-100 font-mono mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-zinc-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <CreditCard className="h-3.5 w-3.5 text-blue-400" /> Card (₹)
                          </label>
                          <Input
                            type="number"
                            value={splitCard || ''}
                            onChange={(e) => setSplitCard(Number(e.target.value))}
                            className="bg-zinc-950 border-white/10 text-xs text-zinc-100 font-mono mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-zinc-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <QrCode className="h-3.5 w-3.5 text-purple-400" /> UPI QR (₹)
                          </label>
                          <Input
                            type="number"
                            value={splitUpi || ''}
                            onChange={(e) => setSplitUpi(Number(e.target.value))}
                            className="bg-zinc-950 border-white/10 text-xs text-zinc-100 font-mono mt-1"
                          />
                        </div>

                        <div>
                          <label className="text-zinc-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-amber-400" /> Loyalty Points
                          </label>
                          <Input
                            type="number"
                            value={splitLoyaltyPoints || ''}
                            onChange={(e) => setSplitLoyaltyPoints(Number(e.target.value))}
                            className="bg-zinc-950 border-white/10 text-xs text-zinc-100 font-mono mt-1"
                          />
                        </div>
                      </div>

                      {remainingBalance > 0 ? (
                        <p className="text-xs font-extrabold text-red-400 animate-pulse flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" /> Remaining Unallocated Amount: ₹{remainingBalance}
                        </p>
                      ) : (
                        <p className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> 100% Split Fully Allocated!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cash Tendered Presets & Change Due Calculation */}
                {(singlePaymentMethod === 'Cash' || (isSplitPayment && splitCash > 0)) && (
                  <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 space-y-3">
                    <label className="text-xs font-bold uppercase text-zinc-400">Cash Tendered Presets</label>
                    <div className="flex flex-wrap gap-2">
                      {[500, 1000, 2000, finalPayable].map((preset) => (
                        <Button
                          key={preset}
                          size="sm"
                          variant="outline"
                          onClick={() => setCashTendered(preset)}
                          className="border-white/10 text-xs font-bold text-amber-300 rounded-xl"
                        >
                          ₹{preset}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                      <span className="text-zinc-400">Cash Tendered: <strong className="text-zinc-100 font-mono">₹{cashTendered}</strong></span>
                      <span className="text-zinc-400">Change Due: <strong className="text-emerald-400 font-mono text-sm">₹{changeDue}</strong></span>
                    </div>
                  </div>
                )}

                {/* Final Tax Invoice Summary Box */}
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{rawTotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({discountPercent}%)</span>
                      <span className="font-mono">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>GST Tax (5%)</span>
                    <span className="font-mono">+₹{gstAmount}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Staff Tip</span>
                      <span className="font-mono">+₹{tipAmount}</span>
                    </div>
                  )}
                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-amber-300">
                      <span>Loyalty Points Redeemed</span>
                      <span className="font-mono">-₹{loyaltyDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-base font-black text-amber-300">
                    <span>Total Final Payable</span>
                    <span className="font-mono text-xl">₹{finalPayable}</span>
                  </div>
                </div>

                {/* Complete Payment Button */}
                <Button
                  onClick={handleCompletePayment}
                  disabled={billPaid || (isSplitPayment && remainingBalance > 0)}
                  className={`w-full py-6 text-sm font-black uppercase rounded-2xl shadow-[0_10px_30px_rgba(168,85,247,0.3)] transition duration-300 ${
                    billPaid
                      ? 'bg-emerald-600 text-zinc-950'
                      : 'bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 text-zinc-950 hover:brightness-110'
                  }`}
                >
                  {billPaid ? (
                    <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Payment Received & Order Closed
                    </span>
                  ) : (
                    `Complete ₹${finalPayable} Checkout`
                  )}
                </Button>
              </Card>
            </div>
          ) : (
            <div className="lg:col-span-8 rounded-[2.5rem] border border-white/10 bg-white/5 p-12 text-center text-zinc-400 text-sm backdrop-blur-xl">
              Select an unpaid order from the left sidebar to start checkout.
            </div>
          )}
        </div>
      </main>

      {/* UPI QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-[2.5rem] border border-white/10 bg-zinc-950 p-6 space-y-4 text-center">
            <h3 className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" /> Scan UPI QR to Pay
            </h3>
            <div className="bg-white p-4 rounded-3xl inline-block mx-auto">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=luft@icici&pn=LuftDining"
                alt="UPI QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>
            <p className="text-xs text-zinc-400 font-mono">luft@icici • Amount: ₹{finalPayable}</p>
            <Button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-amber-500 text-zinc-950 font-bold rounded-2xl text-xs py-3"
            >
              Done / Close QR
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
