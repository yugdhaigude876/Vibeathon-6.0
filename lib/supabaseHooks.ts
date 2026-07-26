'use client'

import { useEffect, useState } from 'react'
import { createClient } from './supabase'
import type { MenuItem } from '@/lib/types'

export interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  menu_items?: {
    name: string
    category: string
    price?: number
    is_available?: boolean
  }
}

export interface Order {
  id: string
  customer_id: string
  total_amount: number
  notes: string | null
  status: string
  created_at: string
  order_items?: OrderItem[]
}

export interface Reservation {
  id: string
  customer_id: string
  restaurant_id: string | null
  reservation_date: string
  reservation_time: string
  party_size: number
  status: string
  created_at: string
}

export function useRealtimeOrders(customerId?: string) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchInitialOrders() {
      try {
        setLoading(true)
        let query = supabase
          .from('orders')
          .select('*, order_items(*, menu_items(*))')
          .order('created_at', { ascending: false })

        if (customerId) {
          query = query.eq('customer_id', customerId)
        }

        const { data, error: err } = await query
        if (err) throw err
        setOrders(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialOrders()

    const filterString = customerId ? `customer_id=eq.${customerId}` : undefined
    const channel = supabase
      .channel('realtime_orders_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: filterString,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data, error: err } = await supabase
              .from('orders')
              .select('*, order_items(*, menu_items(*))')
              .eq('id', payload.new.id)
              .single()

            if (!err && data) {
              setOrders((prev) => [data as Order, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data, error: err } = await supabase
              .from('orders')
              .select('*, order_items(*, menu_items(*))')
              .eq('id', payload.new.id)
              .single()

            if (!err && data) {
              setOrders((prev) =>
                prev.map((order) => (order.id === data.id ? (data as Order) : order))
              )
            }
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [customerId])

  return [orders, loading, error] as const
}

export function useRealtimeMenuItems() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from('menu_items')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (err) throw err
        setItems(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuItems()

    const channel = supabase
      .channel('realtime_menu_items_channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'menu_items' },
        (payload) => {
          const updatedItem = payload.new as MenuItem
          setItems((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return [items, loading, error] as const
}

export function useRealtimeReservations(customerId?: string) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchInitialReservations() {
      try {
        setLoading(true)
        let query = supabase
          .from('reservations')
          .select('*')
          .order('reservation_date', { ascending: true })
          .order('reservation_time', { ascending: true })

        if (customerId) {
          query = query.eq('customer_id', customerId)
        }

        const { data, error: err } = await query
        if (err) throw err
        setReservations(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialReservations()

    const filterString = customerId ? `customer_id=eq.${customerId}` : undefined
    const channel = supabase
      .channel('realtime_reservations_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: filterString,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            setReservations((prev) => [...prev, payload.new as Reservation])
          } else if (payload.eventType === 'UPDATE') {
            setReservations((prev) =>
              prev.map((res) => (res.id === payload.new.id ? (payload.new as Reservation) : res))
            )
          } else if (payload.eventType === 'DELETE') {
            setReservations((prev) => prev.filter((res) => res.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [customerId])

  return [reservations, loading, error] as const
}
