'use client'

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react'
import type { MenuItem } from '@/lib/types'

export interface CartItem {
  item: MenuItem
  quantity: number
}

interface CartContextType {
  cart: Record<string, CartItem>
  cartItems: CartItem[]
  addToCart: (item: MenuItem) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  tax: number
  totalAmount: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'platr_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, CartItem>>({})
  const [isOpen, setIsOpen] = useState<boolean>(false)

  // Load saved cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        setCart(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e)
    }
  }, [])

  // Persist cart to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
    } catch (e) {
      console.error('Failed to save cart to storage', e)
    }
  }, [cart])

  const addToCart = (item: MenuItem) => {
    if (!item.is_available) return
    setCart((prev) => {
      const existing = prev[item.id]
      const currentQty = existing ? existing.quantity : 0
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: currentQty + 1,
        },
      }
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId]
      if (!existing) return prev
      if (existing.quantity <= 1) {
        const updated = { ...prev }
        delete updated[itemId]
        return updated
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity: existing.quantity - 1,
        },
      }
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        const updated = { ...prev }
        delete updated[itemId]
        return updated
      }
      const existing = prev[itemId]
      if (!existing) return prev
      return {
        ...prev,
        [itemId]: {
          ...existing,
          quantity,
        },
      }
    })
  }

  const clearCart = () => {
    setCart({})
  }

  const cartItems = useMemo(() => Object.values(cart), [cart])

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, cartItem) => sum + cartItem.quantity, 0)
  }, [cartItems])

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, cartItem) => sum + cartItem.quantity * Number(cartItem.item.price || 0),
      0
    )
  }, [cartItems])

  const tax = useMemo(() => subtotal * 0.085, [subtotal]) // 8.5% Tax
  const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax])

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        tax,
        totalAmount,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
