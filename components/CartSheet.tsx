'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Loader2, Utensils } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/hooks/use-toast'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function CartSheet() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const {
    cartItems,
    totalItems,
    subtotal,
    tax,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    isOpen,
    setIsOpen,
  } = useCart()

  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    try {
      setIsSubmitting(true)

      // 1. Verify user is logged in
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to place an order.',
          variant: 'destructive',
        })
        setIsOpen(false)
        router.push('/login')
        return
      }

      // 2. Insert record into 'orders' table
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: null,
          customer_id: user.id,
          total_amount: totalAmount,
          notes: notes.trim() || null,
          status: 'pending',
        })
        .select()
        .single()

      if (orderError) {
        console.warn('Error inserting order:', orderError?.message || orderError)
        toast({
          title: 'Order Placement Failed',
          description: orderError.message || 'Failed to create order record.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // 3. Insert corresponding items into 'order_items' table
      const orderItems = cartItems.map((ci) => ({
        order_id: order.id,
        menu_item_id: ci.item.id,
        quantity: ci.quantity,
        unit_price: ci.item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.warn('Error inserting order items:', itemsError?.message || itemsError)
        toast({
          title: 'Order Placement Warning',
          description: 'Order created but failed to attach items. Please contact support.',
          variant: 'destructive',
        })
        setIsSubmitting(false)
        return
      }

      // 4. On success: Clear cart, close sheet, redirect to /orders/[orderId]
      toast({
        title: 'Order Placed Successfully! 🎉',
        description: `Order #${order.id.slice(0, 8)} has been submitted.`,
      })

      clearCart()
      setNotes('')
      setIsOpen(false)
      router.push(`/orders/${order.id}`)
    } catch (err: any) {
      console.warn('Unexpected checkout error:', err?.message || err)
      toast({
        title: 'Checkout Error',
        description: err?.message || 'An unexpected error occurred during checkout.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 flex items-center gap-2 px-3"
        >
          <ShoppingBag className="h-4 w-4 text-amber-500" />
          <span className="hidden sm:inline font-medium">Cart</span>
          {totalItems > 0 && (
            <Badge className="ml-1 bg-amber-600 text-zinc-950 font-bold px-1.5 py-0 text-xs">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-50 p-0">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800 text-left">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-zinc-50 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-500" />
              Your Cart
            </SheetTitle>
            <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Badge>
          </div>
        </SheetHeader>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30 p-6">
              <Utensils className="h-10 w-10 text-zinc-600 mb-3" />
              <p className="font-semibold text-zinc-300">Your cart is currently empty</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Browse our digital menu and add delicious items to get started!
              </p>
            </div>
          ) : (
            cartItems.map(({ item, quantity }) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-zinc-100 truncate">{item.name}</h4>
                  <p className="text-xs text-amber-400 font-medium">
                    ₹{Number(item.price || 0).toFixed(2)} each
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center text-xs font-bold text-zinc-200">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Item Total & Remove Button */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-100 w-14 text-right">
                    ₹{(Number(item.price || 0) * quantity).toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                    className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Notes & Summary */}
        {cartItems.length > 0 && (
          <div className="border-t border-zinc-800 p-6 space-y-4 bg-zinc-950/90">
            {/* Table Number or Order Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Table Number / Order Notes
              </label>
              <Input
                placeholder="e.g. Table 4, no onions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-sm">
              <div className="flex justify-between text-zinc-400 text-xs">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400 text-xs">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-100 font-bold text-base pt-2 border-t border-zinc-800">
                <span>Total</span>
                <span className="text-amber-400">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold py-5 text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  Checkout
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
