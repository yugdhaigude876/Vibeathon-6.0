import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rateLimiter'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id

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

    // ── SECURITY: Rate limiting — 30 toggles/min per user ────────────────────
    if (!checkRateLimit(user.id, 'PUT /api/menu', 30, 60_000)) {
      return rateLimitExceededResponse(60_000)
    }

    // ── SECURITY: Role check — only staff/manager may toggle availability ─────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.role) {
      return NextResponse.json({ error: 'Unauthorized: role not found' }, { status: 401 })
    }

    const userRole = String(profile.role).toLowerCase()
    if (!['staff', 'manager'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: only staff or manager can update menu availability' },
        { status: 403 }
      )
    }

    // ── Fetch the current item ────────────────────────────────────────────────
    const { data: item, error: fetchError } = await supabase
      .from('menu_items')
      .select('is_available')
      .eq('id', id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: fetchError?.message || 'Item not found' }, { status: 404 })
    }

    // ── Toggle the availability ───────────────────────────────────────────────
    const newAvailability = !item.is_available

    const { data: updatedItem, error: updateError } = await supabase
      .from('menu_items')
      .update({ is_available: newAvailability })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
