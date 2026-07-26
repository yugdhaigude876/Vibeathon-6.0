'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cartItems, subtotal, tax, totalAmount, clearCart } = useCart()

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'You cannot place an empty order.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map((c) => ({
            id: c.item.id,
            quantity: c.quantity,
            price: c.item.price,
          })),
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to place order')
      }

      toast({
        title: 'Order Placed successfully! 🛒',
        description: `Order ID: #${data.orderId.slice(0, 8)}`,
      })

      clearCart()

      // Redirect after 2s
      setTimeout(() => {
        router.push(`/orders/${data.orderId}`)
      }, 2000)
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
        <p className="mt-2 text-zinc-400">Add some delicious dishes from our royal menu first.</p>
        <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-400 text-zinc-950">
          <Link href="/menu">Browse Menu</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
          <Link href="/menu">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Checkout Order</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-zinc-800">
              {cartItems.map((c) => (
                <div key={c.item.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-medium text-zinc-100">{c.item.name}</p>
                    <p className="text-sm text-zinc-400">Qty: {c.quantity}</p>
                  </div>
                  <div className="text-right">
                      <p className="font-semibold text-amber-400">₹{(c.item.price * c.quantity).toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">₹{c.item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Special Requests & Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Allergies, table preferences, or delivery notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[100px] rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-400">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-800 pt-3 flex justify-between font-semibold text-lg text-zinc-100">
                <span>Total</span>
                <span className="text-amber-400">${totalAmount.toFixed(2)}</span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-4 bg-amber-500 text-zinc-950 hover:bg-amber-400 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Place Order
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
