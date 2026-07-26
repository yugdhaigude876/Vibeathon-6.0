import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Validates whether a user has one of the required roles.
 * Queries the profiles table using the user's ID.
 */
function getSupabaseClient(cookieStore: any) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
            // Ignored in Server Component context
          }
        },
      },
    }
  )
}

export async function validateUserRole(
  userId: string,
  allowedRoles: string[]
): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = getSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data?.role) return false

  return allowedRoles.includes(String(data.role).toLowerCase())
}

/**
 * Checks whether a given user owns the specified order.
 */
export async function validateUserOwnsOrder(
  userId: string,
  orderId: string
): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = getSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('customer_id', userId)
    .maybeSingle()

  if (error || !data) return false
  return true
}

/**
 * Verifies that a menu item with the given ID exists in the database.
 */
export async function validateMenuItemExists(itemId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = getSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('menu_items')
    .select('id')
    .eq('id', itemId)
    .maybeSingle()

  if (error || !data) return false
  return true
}

/**
 * Checks whether a given user owns the specified reservation.
 */
export async function validateUserOwnsReservation(
  userId: string,
  reservationId: string
): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = getSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('id', reservationId)
    .eq('customer_id', userId)
    .maybeSingle()

  if (error || !data) return false
  return true
}
