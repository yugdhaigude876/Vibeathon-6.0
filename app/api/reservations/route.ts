import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { reservation_date, reservation_time, party_size, name, phone, restaurant_id } = await request.json()

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurant_id || null,
        reservation_date,
        reservation_time,
        party_size: Number(party_size),
        status: 'confirmed', // default to confirmed
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
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    }, { status: 500 })
  }
}
