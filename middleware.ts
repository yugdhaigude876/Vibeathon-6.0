import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleRedirectPath, isManagerOrAdmin, isStaffRole } from '@/lib/services/roleService'
import { UserRole } from '@/lib/types/auth'

const PUBLIC_ROUTES = ['/login', '/signup']
const MANAGER_ROUTES = ['/manager']
const STAFF_ROUTES = ['/staff']
const CUSTOMER_ROUTES = ['/menu', '/orders', '/reservations', '/checkout', '/dashboard']

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/ai') ||
    pathname === '/'
  )
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; user_metadata?: Record<string, unknown> } | null
): Promise<UserRole> {
  if (!user) return 'customer'

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!error && data?.role) {
    return String(data.role).toLowerCase() as UserRole
  }

  const metadataRole = user.user_metadata?.role
  if (typeof metadataRole === 'string' && metadataRole.trim()) {
    return metadataRole.toLowerCase() as UserRole
  }

  return 'customer'
}

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        response = NextResponse.next({
          request: {
            headers: req.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname
  const role = await getUserRole(supabase, user)

  // Allow public routes without forced redirection
  if (isPublicRoute(pathname)) {
    return response
  }

  // 2. Protect /manager routes: only managers and admins allowed
  if (MANAGER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (user && !isManagerOrAdmin(role)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      redirectUrl.searchParams.set('unauthorized', '1')
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // 3. Protect /staff routes: staff, chef, cashier, waiter, delivery, manager, admin allowed
  if (STAFF_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (user && !isStaffRole(role)) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      redirectUrl.searchParams.set('unauthorized', '1')
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
