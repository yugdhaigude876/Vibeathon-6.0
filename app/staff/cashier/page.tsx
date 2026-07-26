'use client'

import React, { useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { useStaffStore } from '@/lib/staffStore'
import { EnterpriseOrder } from '@/lib/staffTypes'
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
} from 'lucide-react'

export default function CashierPage() {
  const { orders, updateOrderStatus } = useStaffStore()
  const [selectedOrder, setSelectedOrder] = useState<EnterpriseOrder | null>(orders[0] || null)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [couponCode, setCouponCode] = useState<string>('')
  const [couponApplied, setCouponApplied] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash'>('UPI')
  const [billPaid, setBillPaid] = useState<boolean>(false)

  const rawTotal = selectedOrder ? selectedOrder.totalAmount : 0
  const discountAmount = Math.round((rawTotal * discountPercent) / 100)
  const gstAmount = Math.round((rawTotal - discountAmount) * 0.05) // 5% GST
  const finalPayable = rawTotal - discountAmount + gstAmount

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'LUFT10') {
      setDiscountPercent(10)
      setCouponApplied(true)
    } else if (couponCode.toUpperCase() === 'PLATR20') {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Cashier & POS Terminal</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Generate GST bills, apply coupons, process split payments, and print receipts.
            </p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-3 py-1 font-bold">
            POS Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Selector List */}
          <div className="space-y-3">
            <h2 className="text-sm font-extrabold uppercase text-zinc-300 tracking-wider">Unpaid & Active Orders</h2>
            {orders.map((ord) => (
              <button
                key={ord.id}
                onClick={() => {
                  setSelectedOrder(ord)
                  setBillPaid(false)
                }}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  selectedOrder?.id === ord.id
                    ? 'border-purple-500 bg-purple-950/20 shadow-lg'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-amber-400">{ord.displayId}</span>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] font-bold uppercase">
                    {ord.orderType.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">{ord.customerName} {ord.tableNumber ? `• Table ${ord.tableNumber}` : ''}</span>
                  <span className="text-amber-400 font-mono font-bold">₹{ord.totalAmount}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Checkout & GST Invoice Panel */}
          {selectedOrder && (
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6">
                <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-zinc-100 flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-purple-400" /> GST Tax Invoice — {selectedOrder.displayId}
                    </CardTitle>
                    <p className="text-xs text-zinc-400 mt-1 font-semibold">
                      Customer: <span className="text-zinc-200">{selectedOrder.customerName}</span> | Date: {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl">
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Receipt
                  </Button>
                </CardHeader>

                <CardContent className="p-0 pt-6 space-y-6">
                  {/* Items Breakdown */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{item.quantity}x {item.name}</span>
                        <span className="font-mono text-zinc-300">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Discounts & Coupon Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Apply Coupon Code</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="e.g. LUFT10 or PLATR20"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 uppercase"
                        />
                        <Button size="sm" onClick={handleApplyCoupon} className="bg-purple-600 hover:bg-purple-700 text-xs font-bold rounded-xl px-4">
                          Apply
                        </Button>
                      </div>
                      {couponApplied && <p className="text-[10px] font-bold text-emerald-400">Coupon applied! {discountPercent}% discount added.</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Select Payment Method</label>
                      <div className="flex gap-2">
                        {(['UPI', 'Card', 'Cash'] as const).map((method) => (
                          <Button
                            key={method}
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex-1 text-xs font-bold rounded-xl ${
                              paymentMethod === method ? 'bg-purple-600 text-zinc-100' : 'border-zinc-800 text-zinc-400'
                            }`}
                          >
                            {method}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Summary Box */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-xs">
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
                    <div className="flex justify-between border-t border-zinc-800 pt-2 text-sm font-black text-amber-400">
                      <span>Final Payable</span>
                      <span className="font-mono text-base">₹{finalPayable}</span>
                    </div>
                  </div>

                  {/* Payment Complete Action */}
                  <Button
                    onClick={handleCompletePayment}
                    disabled={billPaid}
                    className={`w-full py-6 text-sm font-black uppercase rounded-2xl ${
                      billPaid ? 'bg-emerald-600 text-zinc-100' : 'bg-purple-600 hover:bg-purple-700 text-zinc-100'
                    }`}
                  >
                    {billPaid ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" /> Payment Received & Order Closed
                      </span>
                    ) : (
                      `Receive ₹${finalPayable} via ${paymentMethod}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
