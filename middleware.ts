import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CUSTOMER_ONLY_ROUTES = ['/menu', '/orders', '/reservations', '/checkout', '/dashboard']
const AUTHENTICATED_ROUTES: string[] = []
const STAFF_MANAGER_ROUTES = ['/staff']
const MANAGER_ONLY_ROUTES = ['/manager']
const PUBLIC_ROUTES = ['/login', '/signup']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/auth') || pathname.startsWith('/api/ai')
}

function isCustomerOnlyRoute(pathname: string) {
  return CUSTOMER_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isAuthenticatedRoute(pathname: string) {
  return AUTHENTICATED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isStaffOrManagerRoute(pathname: string) {
  return STAFF_MANAGER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isManagerOnlyRoute(pathname: string) {
  return MANAGER_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function getDefaultRedirect(role: string) {
  if (role === 'staff') return '/staff/kitchen'
  if (role === 'manager' || role === 'admin') return '/manager'
  return '/menu'
}

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>,
  user: { id: string; user_metadata?: Record<string, unknown> } | null
) {
  if (!user) return 'customer'

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (!error && data?.role) {
    return String(data.role).toLowerCase()
  }

  const metadataRole = user.user_metadata?.role
  if (typeof metadataRole === 'string' && metadataRole.trim()) {
    return metadataRole.toLowerCase()
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
  const supabaseUrl = (rawUrl && rawUrl.startsWith('http')) ? rawUrl : 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
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
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname
  const role = await getUserRole(supabase, user)

  if (isPublicRoute(pathname)) {
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = getDefaultRedirect(role)
      redirectUrl.search = ''
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  if (!user && !isStaffOrManagerRoute(pathname) && !isManagerOnlyRoute(pathname)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (isStaffOrManagerRoute(pathname)) {
    // If authenticated via Supabase, check role. Otherwise allow demo access.
    if (user && role !== 'staff' && role !== 'manager' && role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      redirectUrl.searchParams.set('unauthorized', '1')
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  // MANAGER_ONLY_ROUTES: allow manager, admin, or demo access
  if (isManagerOnlyRoute(pathname)) {
    if (user && role !== 'manager' && role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      redirectUrl.searchParams.set('unauthorized', '1')
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  if (isCustomerOnlyRoute(pathname)) {
    // Staff, managers, admins, and customers can all access menu and customer pages
    return response
  }

  if (isAuthenticatedRoute(pathname)) {
    return response
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
