import { UserRole } from '@/lib/types/auth'

export const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  customer: '/menu',
  chef: '/staff/kitchen',
  cashier: '/staff/cashier',
  waiter: '/staff/waiter',
  delivery: '/staff/delivery',
  staff: '/staff/kitchen',
  manager: '/manager',
  admin: '/manager',
}

export function getRoleRedirectPath(role?: string | null): string {
  if (!role) return '/menu'
  const normalized = role.toLowerCase() as UserRole
  return ROLE_REDIRECT_MAP[normalized] || '/menu'
}

export function isManagerOrAdmin(role?: string | null): boolean {
  if (!role) return false
  const norm = role.toLowerCase()
  return norm === 'manager' || norm === 'admin'
}

export function isStaffRole(role?: string | null): boolean {
  if (!role) return false
  const norm = role.toLowerCase()
  return (
    norm === 'chef' ||
    norm === 'cashier' ||
    norm === 'waiter' ||
    norm === 'delivery' ||
    norm === 'staff' ||
    norm === 'manager' ||
    norm === 'admin'
  )
}
