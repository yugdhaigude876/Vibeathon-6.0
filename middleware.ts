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
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
