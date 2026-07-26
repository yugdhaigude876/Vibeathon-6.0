'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Sparkles,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Utensils,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cartItems, subtotal, tax, totalAmount, clearCart } = useCart()

  const [tableNumber, setTableNumber] = useState('')
  const [tableNumberTouched, setTableNumberTouched] = useState(false)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [loading, setLoading] = useState(false)

  const tableNumberInvalid = tableNumberTouched && !tableNumber.trim()

  // Card Form State
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16)
    const formatted = val.replace(/(.{4})/g, '$1 ').trim()
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (val.length >= 3) {
      setExpiry(`${val.slice(0, 2)}/${val.slice(2)}`)
    } else {
      setExpiry(val)
    }
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'You cannot place an empty order.',
        variant: 'destructive',
      })
      return
    }

    if (!tableNumber.trim()) {
      toast({
        title: 'Table Number Required ⚠️',
        description: 'Please enter your Table Number before placing an order.',
        variant: 'destructive',
      })
      return
    }

    if (paymentMethod === 'card') {
      if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 15 || !expiry || cvv.length < 3) {
        toast({
          title: 'Invalid Payment Details',
          description: 'Please enter valid credit/debit card information.',
          variant: 'destructive',
        })
        return
      }
    }

    try {
      setLoading(true)

      const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242'
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map((c) => ({
            id: c.item.id,
            name: c.item.name,
            quantity: c.quantity,
            price: c.item.price,
          })),
          tableNumber: tableNumber.trim(),
          table_number: tableNumber.trim(),
          notes,
          paymentMethod,
          paymentDetails: {
            brand: 'VISA',
            last4,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to place order')
      }

      // Save order to localStorage for resilient offline/session display
      try {
        const localOrders = JSON.parse(localStorage.getItem('platr_user_orders') || '[]')
        localOrders.unshift({
          id: data.orderId,
          total_amount: totalAmount,
          status: 'pending',
          notes: notes ? `[Payment: ${paymentMethod.toUpperCase()}] | ${notes}` : `[Payment: ${paymentMethod.toUpperCase()}]`,
          created_at: new Date().toISOString(),
        })
        localStorage.setItem('platr_user_orders', JSON.stringify(localOrders.slice(0, 20)))
      } catch (err) {
        console.warn('LocalStorage order save failed:', err)
      }

      toast({
        title: paymentMethod === 'card' ? 'Payment Approved & Order Placed! 🎉' : 'Order Confirmed (Pay on Delivery)! 🍽️',
        description: `Order Ref: #${data.orderId.slice(0, 8)}`,
      })

      clearCart()

      setTimeout(() => {
        router.push(`/orders/${data.orderId}`)
      }, 1500)
    } catch (err: any) {
      toast({
        title: 'Checkout Failed',
        description: err.message || 'An error occurred during checkout.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-zinc-600" />
        <h2 className="mt-4 text-2xl font-semibold text-zinc-100">Your cart is empty</h2>
        <p className="mt-2 text-zinc-400">Add some delicious dishes from our digital menu first.</p>
        <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-zinc-100 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Button asChild variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
          <Link href="/menu">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            Checkout & Payment
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Review items, pick payment method, and complete order</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Order Items & Special Requests */}
        <div className="md:col-span-2 space-y-6">
          {/* Table Number Required Card */}
          <Card className="border-amber-500/40 bg-zinc-900/90 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-400">
                <Utensils className="h-4 w-4" />
                Table Number <span className="text-red-400">*</span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Enter your assigned dining table number for instant kitchen & server delivery.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter table number (required)"
                value={tableNumber}
                onChange={(e) => { setTableNumber(e.target.value); setTableNumberTouched(true) }}
                onBlur={() => setTableNumberTouched(true)}
                className={`bg-zinc-950 text-base font-bold text-amber-300 placeholder:text-zinc-600 focus-visible:ring-amber-500 py-5 ${
                  tableNumberInvalid
                    ? 'border-red-500 focus-visible:ring-red-500'
                    : 'border-amber-500/50'
                }`}
              />
              {tableNumberInvalid && (
                <p className="text-xs text-red-400 mt-2 font-semibold">⚠️ Table number is required to place an order.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-100">
                <Utensils className="h-4 w-4 text-amber-400" />
                Selected Dishes ({cartItems.reduce((s, i) => s + i.quantity, 0)})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-zinc-800/80 pt-1">
              {cartItems.map((c) => (
                <div key={c.item.id} className="flex justify-between items-center py-3.5">
                  <div>
                    <p className="font-semibold text-sm text-zinc-100">{c.item.name}</p>
                    <p className="text-xs text-zinc-400">
                      Qty: <span className="font-bold text-amber-300">{c.quantity}</span> × ₹{c.item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-amber-400 text-sm">
                      ₹{(c.item.price * c.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Gateway Section */}
          <Card className="border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-zinc-100">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                  Select Payment Option
                </CardTitle>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  256-Bit Encrypted
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Choose cash on delivery or instant card/UPI payment.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <Tabs
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as 'card' | 'cash')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-zinc-950 p-1 border border-zinc-800">
                  <TabsTrigger
                    value="card"
                    className="data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950 font-bold text-xs sm:text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Card / UPI Payment
                  </TabsTrigger>
                  <TabsTrigger
                    value="cash"
                    className="data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950 font-bold text-xs sm:text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <Banknote className="h-4 w-4" />
                    Pay at Counter / Cash
                  </TabsTrigger>
                </TabsList>

                {/* Card Payment Content */}
                <TabsContent value="card" className="space-y-4 pt-4">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                    Simulated Instant Gateway — Test cards accepted
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-zinc-300">Cardholder Name</Label>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-sm text-zinc-100 focus-visible:ring-amber-500"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-zinc-300">Card Number</Label>
                      <Input
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="bg-zinc-950 border-zinc-800 text-sm font-mono text-zinc-100 focus-visible:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-zinc-300">Expiry (MM/YY)</Label>
                        <Input
                          placeholder="12/28"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="bg-zinc-950 border-zinc-800 text-sm font-mono text-zinc-100 focus-visible:ring-amber-500"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-300">CVV</Label>
                        <Input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          className="bg-zinc-950 border-zinc-800 text-sm font-mono text-zinc-100 focus-visible:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Cash Payment Content */}
                <TabsContent value="cash" className="pt-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-200 space-y-1">
                    <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Pay Cash at Counter / On Delivery
                    </p>
                    <p className="text-zinc-400">
                      Your order ticket will be dispatched to the kitchen instantly. Please present your order ref to pay when collecting or receiving food.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Notes & Table Preferences */}
          <Card className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-zinc-100">Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Table number, dietary preferences, or preparation notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[80px] rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary & Place Button */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/90 shadow-xl sticky top-20">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <CardTitle className="text-lg font-bold text-zinc-100">Order Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-200">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>GST / Taxes (5%)</span>
                <span className="font-semibold text-zinc-200">₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between font-bold text-lg text-zinc-100">
                <span>Grand Total</span>
                <span className="text-amber-400 font-extrabold text-xl">₹{totalAmount.toFixed(2)}</span>
              </div>

              <Button
                onClick={() => {
                  setTableNumberTouched(true)
                  handlePlaceOrder()
                }}
                disabled={loading || !tableNumber.trim()}
                className="w-full mt-4 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold py-6 text-base shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {!tableNumber.trim()
                      ? 'Enter Table Number to Order'
                      : paymentMethod === 'card' ? `Pay ₹${totalAmount.toFixed(2)} & Order` : 'Confirm Order (Pay Cash)'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
