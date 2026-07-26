import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimiter'

const OPEN_HOUR = 11   // 11 AM
const CLOSE_HOUR = 22  // 10 PM
const MAX_PARTY_SIZE = 10
const MIN_PARTY_SIZE = 1

export async function POST(request: Request) {
  try {
    const { reservation_date, reservation_time, party_size, name, phone, restaurant_id } =
      await request.json()

    // ── Basic field validation ────────────────────────────────────────────────
    if (!reservation_date || !reservation_time || !party_size) {
      return NextResponse.json({ error: 'Missing required reservation fields' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignored when called from Server Component context
            }
          },
        },
      }
    )

    // ── SECURITY: Authenticate the caller ────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── SECURITY: Rate limiting — 5 reservations/min per user ────────────────
    if (!checkRateLimit(user.id, 'POST /api/reservations', 5, 60_000)) {
      return rateLimitExceededResponse(60_000)
    }

    // ── SECURITY: Role check — staff/managers should not create customer reservations ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const userRole = profile?.role ? String(profile.role).toLowerCase() : 'customer'

    if (profile?.role && !['customer'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: only customers can create reservations' },
        { status: 403 }
      )
    }

    // ── SECURITY: Date validation — must be in the future ────────────────────
    const requestedDate = new Date(`${reservation_date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return NextResponse.json(
        { error: 'Reservation date must be today or in the future' },
        { status: 400 }
      )
    }

    // ── SECURITY: Time validation — must be within 11 AM–10 PM ──────────────
    const [hourStr, minuteStr] = String(reservation_time).split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr || '0', 10)

    if (
      isNaN(hour) ||
      isNaN(minute) ||
      hour < OPEN_HOUR ||
      hour >= CLOSE_HOUR ||
      minute < 0 ||
      minute > 59
    ) {
      return NextResponse.json(
        { error: `Reservation time must be between ${OPEN_HOUR}:00 AM and ${CLOSE_HOUR}:00 PM` },
        { status: 400 }
      )
    }

    // ── SECURITY: Party size validation ───────────────────────────────────────
    const parsedPartySize = Number(party_size)
    if (
      isNaN(parsedPartySize) ||
      parsedPartySize < MIN_PARTY_SIZE ||
      parsedPartySize > MAX_PARTY_SIZE
    ) {
      return NextResponse.json(
        { error: `Party size must be between ${MIN_PARTY_SIZE} and ${MAX_PARTY_SIZE}` },
        { status: 400 }
      )
    }

    // ── SECURITY: Always use auth.uid() as customer_id (never trust body) ─────
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurant_id || null,
        reservation_date,
        reservation_time,
        party_size: parsedPartySize,
        status: 'confirmed',
        name: name || null,
        phone: phone || null,
      })
      .select()
      .single()

    if (resError) {
      return NextResponse.json({ error: resError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reservationId: reservation.id })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
