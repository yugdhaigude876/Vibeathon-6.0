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

      if (!user) {
        setLoading(false)
        return
      }

      const { data, error: fetchErr } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchErr) {
        console.warn('Error fetching reservations:', fetchErr?.message || fetchErr)
        setError(fetchErr.message || 'Failed to fetch reservations')
      } else if (data) {
        setReservations(data as Reservation[])
      }
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

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to make a reservation.',
          variant: 'destructive',
        })
        return
      }

      const formattedDate = selectedDate.toISOString().split('T')[0]

      // Payload supporting both standard column names
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

      if (insertErr) {
        // Retry with minimalist column payload if full object schema fails
        const { error: fallbackErr } = await supabase.from('reservations').insert({
          customer_id: user.id,
          party_size: Number(partySize),
          status: 'confirmed',
          date: formattedDate,
          time: selectedTime,
        })

        if (fallbackErr) {
          throw new Error(fallbackErr.message)
        }
      }

      toast({
        title: 'Royal Table Reserved! 👑',
        description: `Confirmed for ${partySize} guests on ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
      })

      // Reset form & switch tab
      fetchReservations()
      setActiveTab('history')
    } catch (err: any) {
      console.error('Booking error:', err)
      toast({
        title: 'Reservation Failed',
        description: err?.message || 'Failed to place reservation. Please try again.',
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

      const { error: updateErr } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId)

      if (updateErr) {
        throw new Error(updateErr.message)
      }

      toast({
        title: 'Reservation Cancelled',
        description: 'Your table reservation has been updated to cancelled.',
      })

      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
      )
    } catch (err: any) {
      toast({
        title: 'Cancellation Error',
        description: err?.message || 'Failed to cancel reservation.',
        variant: 'destructive',
      })
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-0 pb-16">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center gap-2 border-b border-amber-500/20 pb-6">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-7 w-7 text-amber-400" />
          <h1 className="text-3xl sm:text-4xl font-extrabold gold-gradient-text">Royal Table Reservations</h1>
        </div>
        <p className="text-sm text-zinc-400 max-w-lg">
          Reserve an exclusive dining table for your party and manage upcoming visits seamlessly.
        </p>
      </div>

      {/* Tabs View */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900/90 border border-amber-500/30 p-1.5 rounded-xl">
          <TabsTrigger
            value="book"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950 rounded-lg transition-all"
          >
            <CalendarCheck className="h-4 w-4" />
            Book a Table
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-bold data-[state=active]:bg-amber-600 data-[state=active]:text-zinc-950 rounded-lg transition-all"
          >
            <Crown className="h-4 w-4" />
            My Reservations ({reservations.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Book a Table Form */}
        <TabsContent value="book" className="mt-6">
          <Card className="royal-card border border-amber-500/30">
            <CardHeader className="border-b border-amber-500/20 pb-4 text-center">
              <CardTitle className="text-xl font-bold text-zinc-100 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Reserve Your Dining Experience
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-amber-400" />
                      Reservation Date
                    </label>
                    <Popover
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800 h-10 px-3.5"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2 text-amber-400 shrink-0" />
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
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Time Slot
                    </label>
                    <Select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Party Size Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-amber-400" />
                      Party Size (1 - 10 Guests)
                    </label>
                    <Select
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-amber-400" />
                      Guest Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter guest full name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                </div>

                {/* Customer Phone */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-amber-200/90 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-amber-400" />
                    Contact Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 w-full"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="royal-button w-full py-5 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Securing Table...
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Confirm Royal Reservation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: My Reservations List */}
        <TabsContent value="history" className="mt-6">
          {error && (
            <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400 flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : reservations.length === 0 ? (
            <div className="royal-card p-12 text-center space-y-4">
              <Crown className="h-12 w-12 text-zinc-600 mx-auto" />
              <h3 className="text-xl font-bold text-zinc-300">No Reservations Found</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                You have no table bookings yet. Reserve a table now to enjoy our royal dining.
              </p>
              <Button
                className="royal-button mt-2"
                onClick={() => setActiveTab('book')}
              >
                Book a Table Now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reservations.map((res) => {
                const dateStr = res.reservation_date || res.date || 'TBD'
                const timeStr = res.reservation_time || res.time || 'TBD'
                const guests = res.party_size || res.guests_count || 1
                const status = (res.status || 'confirmed').toLowerCase()
                const isCancelled = status === 'cancelled'
                const isCompleted = status === 'completed'

                return (
                  <Card
                    key={res.id}
                    className={`royal-card transition-all ${
                      isCancelled ? 'opacity-60 border-zinc-800' : 'border-amber-500/30'
                    }`}
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge
                            variant="outline"
                            className={`uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5 ${
                              isCancelled
                                ? 'border-red-800 text-red-400 bg-red-950/30'
                                : isCompleted
                                ? 'border-emerald-800 text-emerald-400 bg-emerald-950/30'
                                : 'border-amber-500/40 text-amber-300 bg-amber-950/40'
                            }`}
                          >
                            {status}
                          </Badge>
                          <h4 className="text-base font-bold text-zinc-100 mt-2">
                            {res.guest_name || res.name || 'Royal Guest'}
                          </h4>
                        </div>

                        {!isCancelled && !isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancellingId === res.id}
                            onClick={() => handleCancelReservation(res.id)}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 px-2.5 border border-red-900/40 rounded-lg"
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

                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-zinc-800/80 pt-3">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CalendarIcon className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Users className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                        </div>
                        {res.phone && (
                          <div className="flex items-center gap-2 text-zinc-300 truncate">
                            <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                            <span className="truncate">{res.phone}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
