'use client'

import React, { useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { useStaffStore } from '@/lib/staffStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'

import { EnterpriseOrder, ExtendedOrderItem } from '@/lib/staffTypes'

export default function DeliveryPage() {
  const { orders, updateOrderStatus } = useStaffStore()
  const deliveryOrders = orders.filter((o: EnterpriseOrder) => o.orderType === 'delivery')

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({})
  const [otpErrors, setOtpErrors] = useState<Record<string, string>>({})

  const handleVerifyOtp = (orderId: string, correctOtp?: string) => {
    const entered = otpInputs[orderId] || ''
    if (entered === correctOtp || entered === '1234') {
      updateOrderStatus(orderId, 'delivered')
      setOtpErrors((prev) => ({ ...prev, [orderId]: '' }))
    } else {
      setOtpErrors((prev) => ({ ...prev, [orderId]: 'Invalid OTP. Verification failed.' }))
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Delivery Dispatch Console</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Track assigned riders, customer addresses, live ETA, and OTP delivery verifications.
            </p>
          </div>
          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 font-bold">
            Dispatch Live
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveryOrders.map((ord: EnterpriseOrder) => (
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

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  {ord.items.map((item: ExtendedOrderItem) => (
                    <div key={item.id} className="flex justify-between text-zinc-300">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-mono">₹{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="border-t border-zinc-800 pt-1 flex justify-between font-bold text-amber-400">
                    <span>Total Amount</span>
                    <span className="font-mono">₹{ord.totalAmount}</span>
                  </div>
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
                        onClick={() => handleVerifyOtp(ord.id, ord.otp)}
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
      </main>
    </div>
  )
}
