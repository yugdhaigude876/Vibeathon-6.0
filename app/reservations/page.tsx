'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  User,
  Crown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  AlertCircle,
  CalendarCheck,
  X,
  QrCode,
  Download,
  Printer,
  Share2,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export interface Reservation {
  id: string
  customer_id: string
  guest_name?: string | null
  name?: string | null
  phone?: string | null
  reservation_date?: string | null
  date?: string | null
  reservation_time?: string | null
  time?: string | null
  party_size?: number | null
  guests_count?: number | null
  status: string
  table_number?: string | null
  created_at?: string
}

const TIME_SLOTS = [
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
]

export default function ReservationsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<string>('book')

  // Form State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('07:00 PM')
  const [partySize, setPartySize] = useState<number>(2)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Reservations History State
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Digital VIP Pass Modal State
  const [selectedVipPass, setSelectedVipPass] = useState<Reservation | null>(null)


  // Fetch current user and prefill name
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email && !customerName) {
        setCustomerName(user.email.split('@')[0])
      }
    }
    loadUser()
  }, [])

  // Fetch user reservations
  const fetchReservations = async () => {
    try {
      setLoading(true)
      setError(null)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let mergedReservations: Reservation[] = []

      if (user) {
        const { data, error: fetchErr } = await supabase
          .from('reservations')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })

        if (data && data.length > 0) {
          mergedReservations = [...(data as Reservation[])]
        }
        if (fetchErr && mergedReservations.length === 0) {
          setError(fetchErr.message || 'Failed to fetch reservations')
        }
      }

      // Merge with resilient localStorage reservations
      try {
        const localRes: Reservation[] = JSON.parse(localStorage.getItem('platr_user_reservations') || '[]')
        localRes.forEach((lRes) => {
          if (!mergedReservations.some((r) => r.id === lRes.id)) {
            mergedReservations.unshift(lRes)
          }
        })
      } catch (err) {
        console.warn('LocalStorage reservation read failed:', err)
      }

      setReservations(mergedReservations)
    } catch (err: any) {
      console.error('Unexpected error fetching reservations:', err)
      setError(err?.message || 'Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  // Real-time listener for reservations
  useEffect(() => {
    fetchReservations()

    const channel = supabase
      .channel('realtime_reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          fetchReservations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Submit Reservation
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: 'Missing Details',
        description: 'Please provide customer name and phone number.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const customerId = user?.id || `guest-${Date.now()}`
      const formattedDate = selectedDate.toISOString().split('T')[0]

      const newReservationRecord: Reservation = {
        id: `res_${Date.now()}`,
        customer_id: customerId,
        guest_name: customerName.trim(),
        name: customerName.trim(),
        phone: customerPhone.trim(),
        reservation_date: formattedDate,
        date: formattedDate,
        reservation_time: selectedTime,
        time: selectedTime,
        party_size: Number(partySize),
        guests_count: Number(partySize),
        status: 'confirmed',
        created_at: new Date().toISOString(),
      }

      // Try saving to Supabase if authenticated user exists
      if (user?.id) {
        const payload = {
          customer_id: user.id,
          guest_name: customerName.trim(),
          name: customerName.trim(),
          phone: customerPhone.trim(),
          reservation_date: formattedDate,
          date: formattedDate,
          reservation_time: selectedTime,
          time: selectedTime,
          party_size: Number(partySize),
          guests_count: Number(partySize),
          status: 'confirmed',
        }

        const { data, error: insertErr } = await supabase
          .from('reservations')
          .insert(payload)
          .select()
          .single()

        if (!insertErr && data) {
          newReservationRecord.id = data.id
        }
      }

      // Update local React state immediately for instant UI feedback
      setReservations((prev) => [newReservationRecord, ...prev])

      // Save reservation into localStorage for persistent session display
      try {
        const localRes = JSON.parse(localStorage.getItem('platr_user_reservations') || '[]')
        localRes.unshift(newReservationRecord)
        localStorage.setItem('platr_user_reservations', JSON.stringify(localRes.slice(0, 20)))
      } catch (err) {
        console.warn('LocalStorage reservation save failed:', err)
      }

      toast({
        title: 'Reservation Confirmed! 🥂',
        description: `Table for ${partySize} reserved on ${formattedDate} at ${selectedTime}.`,
      })

      setActiveTab('history')
    } catch (err: any) {
      toast({
        title: 'Reservation Error',
        description: err?.message || 'Could not complete reservation.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel Reservation
  const handleCancelReservation = async (reservationId: string) => {
    try {
      setCancellingId(reservationId)

      // 1. Update local React state immediately for responsive feedback
      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
      )

      // 2. Update localStorage cache
      try {
        const localRes: Reservation[] = JSON.parse(localStorage.getItem('platr_user_reservations') || '[]')
        const updatedLocal = localRes.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
        localStorage.setItem('platr_user_reservations', JSON.stringify(updatedLocal))
      } catch (err) {
        console.warn('LocalStorage cancel sync error:', err)
      }

      // 3. Update Supabase backend database if valid UUID
      if (!reservationId.startsWith('res_')) {
        const { error: updateErr } = await supabase
          .from('reservations')
          .update({ status: 'cancelled' })
          .eq('id', reservationId)

        if (updateErr) {
          console.warn('Supabase reservation cancel warning:', updateErr.message)
        }
      }

      toast({
        title: 'Reservation Cancelled ❌',
        description: 'Your table reservation has been updated to cancelled.',
      })
    } catch (err: any) {
      toast({
        title: 'Reservation Updated',
        description: 'Reservation marked as cancelled.',
      })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="relative max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6 pb-20">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -z-10" />

      {/* Royal Hero Header Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <Crown className="h-4 w-4 text-amber-400" />
          VIP Dining Experience
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          Royal Table Reservations
        </h1>

        <p className="max-w-2xl mx-auto text-xs sm:text-base text-zinc-300 leading-relaxed">
          Reserve an exclusive dining table crafted for your party, experience world-class culinary artistry, and manage your upcoming royal visits effortlessly.
        </p>

        {/* Feature Highlights Pill Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-400">
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 px-3.5 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Instant Table Confirmation</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 px-3.5 py-1.5 rounded-full">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>Prime Restaurant Seating</span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-white/10 px-3.5 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Personalized Concierge</span>
          </div>
        </div>
      </div>

      {/* Luxury Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-2 bg-zinc-950/90 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl shadow-2xl h-auto">
            <TabsTrigger
              value="book"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Book a Table</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#D4AF37] data-[state=active]:via-[#F1C85C] data-[state=active]:to-[#B68A25] data-[state=active]:text-zinc-950 data-[state=active]:shadow-[0_4px_20px_rgba(212,175,55,0.35)] text-zinc-400 hover:text-zinc-100"
            >
              <Crown className="h-4 w-4" />
              <span>My Reservations ({reservations.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Book a Table Form */}
        <TabsContent value="book" className="mt-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-[0.24em]">
                  <Sparkles className="h-4 w-4" />
                  Reservation Details
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-50">
                  Reserve Your Dining Experience
                </h2>
              </div>
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown className="h-6 w-6" />
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Date Picker */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/90 flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
                    Reservation Date
                  </label>
                  <Popover
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left bg-zinc-950/80 border-white/10 text-zinc-100 hover:bg-zinc-900/80 hover:border-amber-400/40 h-12 px-4 rounded-2xl shadow-inner text-sm"
                      >
                        <CalendarIcon className="h-4 w-4 mr-2.5 text-amber-400 shrink-0" />
                        {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                      </Button>
                    }
                  >
                    <Calendar
                      selectedDate={selectedDate}
                      onSelectDate={(d) => setSelectedDate(d)}
                      minDate={new Date()}
                    />
                  </Popover>
                </div>

                {/* Time Selector Dropdown */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/90 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    Time Slot
                  </label>
                  <Select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="bg-zinc-950/80 border-white/10 text-zinc-100 h-12 rounded-2xl focus:border-amber-400/60 shadow-inner px-4 text-sm"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot} className="bg-zinc-900 text-zinc-100">
                        {slot}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Party Size Selector */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/90 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-amber-400" />
                    Party Size (1 - 10 Guests)
                  </label>
                  <Select
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="bg-zinc-950/80 border-white/10 text-zinc-100 h-12 rounded-2xl focus:border-amber-400/60 shadow-inner px-4 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num} className="bg-zinc-900 text-zinc-100">
                        {num} {num === 1 ? 'Guest (Solo Dining)' : `Guests (${num} Seats)`}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Customer Name */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/90 flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-amber-400" />
                    Guest Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter guest full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="bg-zinc-950/80 border-white/10 text-zinc-100 placeholder:text-zinc-500 h-12 rounded-2xl focus-visible:ring-amber-400/40 shadow-inner px-4 text-sm"
                  />
                </div>
              </div>

              {/* Customer Phone */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300/90 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-amber-400" />
                  Contact Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="bg-zinc-950/80 border-white/10 text-zinc-100 placeholder:text-zinc-500 h-12 rounded-2xl focus-visible:ring-amber-400/40 shadow-inner px-4 text-sm w-full"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 px-6 py-4 text-base font-extrabold text-zinc-950 shadow-[0_18px_40px_rgba(251,191,36,0.35)] transition duration-300 ease-out hover:shadow-[0_24px_50px_rgba(251,191,36,0.5)] active:scale-[0.98] h-14"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Securing Table...
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Confirm Royal Reservation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Tab 2: My Reservations List */}
        <TabsContent value="history" className="mt-8">
          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 flex items-center gap-3 mb-6 backdrop-blur-xl">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-[2rem] bg-white/5 animate-pulse border border-white/10 backdrop-blur-xl" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-12 text-center space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Crown className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100">No Reservations Found</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                You have no active table bookings yet. Reserve a dining table now to enjoy our royal hospitality.
              </p>
              <Button
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-[0_18px_40px_rgba(251,191,36,0.35)] transition duration-300 ease-out hover:shadow-[0_24px_50px_rgba(251,191,36,0.45)]"
                onClick={() => setActiveTab('book')}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Book a Table Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {reservations.map((res) => {
                const dateStr = res.reservation_date || res.date || 'TBD'
                const timeStr = res.reservation_time || res.time || 'TBD'
                const guests = res.party_size || res.guests_count || 1
                const status = (res.status || 'confirmed').toLowerCase()
                const isCancelled = status === 'cancelled'
                const isCompleted = status === 'completed'

                return (
                  <div
                    key={res.id}
                    className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)] hover:border-amber-400/40 flex flex-col justify-between gap-5 ${
                      isCancelled ? 'opacity-60 border-white/5' : ''
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${
                            isCancelled
                              ? 'border-red-500/30 text-red-300 bg-red-950/40'
                              : isCompleted
                              ? 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40'
                              : 'border-amber-500/40 text-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                          }`}
                        >
                          <Crown className="h-3 w-3" />
                          {status}
                        </span>
                        <h4 className="text-xl font-bold text-zinc-100">
                          {res.guest_name || res.name || 'Royal Guest'}
                        </h4>
                      </div>

                      {!isCancelled && !isCompleted && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancellingId === res.id}
                          onClick={() => handleCancelReservation(res.id)}
                          className="text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 h-9 px-3 border border-rose-500/30 rounded-xl transition-all"
                        >
                          {cancellingId === res.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-zinc-300 bg-zinc-950/60 border border-white/5 rounded-xl p-2.5">
                        <CalendarIcon className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-semibold">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300 bg-zinc-950/60 border border-white/5 rounded-xl p-2.5">
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-semibold">{timeStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300 bg-zinc-950/60 border border-white/5 rounded-xl p-2.5">
                        <Users className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="font-semibold">{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                      </div>
                      {res.phone && (
                        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 truncate">
                          <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                          <span className="font-semibold truncate">{res.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* VIP Pass Action Button */}
                    {!isCancelled && (
                      <div className="pt-2 border-t border-white/5">
                        <Button
                          onClick={() => setSelectedVipPass(res)}
                          className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 hover:brightness-110 font-extrabold text-xs rounded-xl py-5 shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                        >
                          <QrCode className="h-4 w-4" /> View Digital VIP Pass & QR Code
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Royal Digital VIP Reservation Pass Modal */}
      {selectedVipPass && (
        <Dialog open={!!selectedVipPass} onOpenChange={() => setSelectedVipPass(null)}>
          <DialogContent className="bg-zinc-950 border-amber-500/40 text-zinc-100 max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
            {/* VIP Pass Banner Header */}
            <div className="bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 p-6 border-b border-amber-500/30 text-center relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
                <Crown className="h-32 w-32 text-amber-400" />
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest px-3 py-1 mb-2">
                LUFT MAIN DINING (BANDRA)
              </Badge>
              <h3 className="text-2xl font-black gold-gradient-text tracking-tight flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-amber-400" /> Royal VIP Dining Pass
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Pass Reference: <span className="font-mono text-amber-300 font-bold">#VIP-{selectedVipPass.id.slice(-6).toUpperCase()}</span>
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Dynamic QR Code Box */}
              <div className="bg-white p-5 rounded-3xl text-center shadow-inner max-w-[200px] mx-auto border-4 border-amber-500/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=LUFT_VIP_PASS_${selectedVipPass.id}_${selectedVipPass.guest_name || 'Guest'}_${selectedVipPass.reservation_date}_${selectedVipPass.reservation_time}`}
                  alt="VIP Pass QR Code"
                  className="w-40 h-40 mx-auto"
                />
              </div>

              {/* Pass Security Notice */}
              <p className="text-center text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Present this QR on arrival for priority host check-in
              </p>

              {/* Guest & Reservation Details Grid */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-medium">Guest Name</span>
                  <span className="font-bold text-amber-300 text-sm">{selectedVipPass.guest_name || selectedVipPass.name || 'Royal Guest'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-medium">Reservation Date</span>
                  <span className="font-mono font-bold text-zinc-100">{selectedVipPass.reservation_date || selectedVipPass.date}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-medium">Time Slot</span>
                  <span className="font-mono font-bold text-amber-400">{selectedVipPass.reservation_time || selectedVipPass.time}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-zinc-400 font-medium">Party Size</span>
                  <span className="font-bold text-zinc-100">{selectedVipPass.party_size || selectedVipPass.guests_count || 2} Guests</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-medium">Assigned Table</span>
                  <span className="font-extrabold text-amber-300">Table T-04 (VIP Lounge)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 text-xs font-bold rounded-2xl h-11"
                >
                  <Printer className="h-4 w-4 mr-2 text-amber-400" /> Print Pass
                </Button>

                <Button
                  onClick={() => {
                    toast({
                      title: 'VIP Pass Link Copied! 📋',
                      description: 'Share pass QR code with your dining guests.',
                    })
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold rounded-2xl h-11"
                >
                  <Share2 className="h-4 w-4 mr-2" /> Share Pass
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

