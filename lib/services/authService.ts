import { getCurrentUser, getUserProfile, signOut } from '@/lib/auth'
import { hasPermission } from '@/lib/services/permissionService'
import { getRoleRedirectPath, isManagerOrAdmin, isStaffRole } from '@/lib/services/roleService'
import { Permission, UserProfile, UserRole } from '@/lib/types/auth'

export async function requireAuth(): Promise<{ user: any; profile: UserProfile | null }> {
  const user = await getCurrentUser()
  if (!user) {
    return { user: null, profile: null }
  }
  const { profile } = await getUserProfile(user.id)
  return { user, profile }
}

export async function requireCustomer(): Promise<boolean> {
  const { user, profile } = await requireAuth()
  if (!user) return false
  const role = profile?.role || 'customer'
  return role === 'customer'
}

export async function requireStaff(): Promise<boolean> {
  const { user, profile } = await requireAuth()
  if (!user) return false
  return isStaffRole(profile?.role)
}

export async function requireManager(): Promise<boolean> {
  const { user, profile } = await requireAuth()
  if (!user) return false
  return isManagerOrAdmin(profile?.role)
}

export async function requirePermission(permission: Permission): Promise<boolean> {
  const { user, profile } = await requireAuth()
  if (!user) return false
  return hasPermission(profile?.role, permission)
}

export { getRoleRedirectPath, signOut }
