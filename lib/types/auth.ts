export type UserRole =
  | 'customer'
  | 'chef'
  | 'cashier'
  | 'waiter'
  | 'delivery'
  | 'manager'
  | 'admin'
  | 'staff'

export type Permission =
  | 'view:menu'
  | 'place:order'
  | 'view:orders'
  | 'update:kitchen_status'
  | 'manage:billing'
  | 'manage:payments'
  | 'manage:refunds'
  | 'manage:tables'
  | 'manage:customer_requests'
  | 'manage:deliveries'
  | 'manage:inventory'
  | 'manage:menu_erp'
  | 'manage:marketing'
  | 'manage:finance'
  | 'manage:reports'
  | 'manage:users'
  | 'manage:ai_insights'
  | 'system:admin'

export interface UserProfile {
  id: string
  email: string | null
  full_name?: string | null
  avatar_url?: string | null
  role: UserRole
  branch?: string | null
  department?: string | null
  status?: 'active' | 'suspended' | 'deactivated'
  created_at?: string
  updated_at?: string
}

export interface AuthSession {
  user: {
    id: string
    email?: string
    role?: UserRole
  } | null
  profile: UserProfile | null
}
