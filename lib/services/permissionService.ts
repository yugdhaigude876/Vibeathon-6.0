import { Permission, UserRole } from '@/lib/types/auth'

const ROLE_PERMISSIONS_MAP: Record<UserRole, Permission[]> = {
  customer: ['view:menu', 'place:order'],
  chef: ['view:orders', 'update:kitchen_status'],
  cashier: ['view:orders', 'manage:billing', 'manage:payments', 'manage:refunds'],
  waiter: ['view:orders', 'manage:tables', 'manage:customer_requests'],
  delivery: ['view:orders', 'manage:deliveries'],
  staff: [
    'view:orders',
    'update:kitchen_status',
    'manage:billing',
    'manage:payments',
    'manage:tables',
    'manage:deliveries',
  ],
  manager: [
    'view:menu',
    'place:order',
    'view:orders',
    'update:kitchen_status',
    'manage:billing',
    'manage:payments',
    'manage:refunds',
    'manage:tables',
    'manage:customer_requests',
    'manage:deliveries',
    'manage:inventory',
    'manage:menu_erp',
    'manage:marketing',
    'manage:finance',
    'manage:reports',
    'manage:users',
    'manage:ai_insights',
  ],
  admin: [
    'view:menu',
    'place:order',
    'view:orders',
    'update:kitchen_status',
    'manage:billing',
    'manage:payments',
    'manage:refunds',
    'manage:tables',
    'manage:customer_requests',
    'manage:deliveries',
    'manage:inventory',
    'manage:menu_erp',
    'manage:marketing',
    'manage:finance',
    'manage:reports',
    'manage:users',
    'manage:ai_insights',
    'system:admin',
  ],
}

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false
  const normalized = role.toLowerCase() as UserRole
  const permissions = ROLE_PERMISSIONS_MAP[normalized] || []
  return permissions.includes(permission) || permissions.includes('system:admin')
}
