'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/services/permissionService'
import { getRoleRedirectPath } from '@/lib/services/roleService'
import { Permission, UserRole } from '@/lib/types/auth'

type AllowedRole = UserRole | 'authenticated'

function shouldAllowRole(role: string, allowedRoles: AllowedRole[]) {
  const normalizedRole = String(role || '').toLowerCase() as UserRole

  if (normalizedRole === 'admin') {
    return true
  }

  if (allowedRoles.includes('authenticated')) {
    return true
  }

  return allowedRoles.includes(normalizedRole)
}

export function useRoleGuard(
  allowedRoles: AllowedRole[],
  requiredPermission?: Permission,
  fallbackPath?: string
) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)

  const allowedKey = allowedRoles.join(',')

  useEffect(() => {
    let active = true

    const checkRole = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active) return

      if (!user) {
        // Demo fallback mode for unauthenticated development sessions
        setAuthorized(true)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const role = String(profile?.role || user.user_metadata?.role || 'customer').toLowerCase()

      if (!shouldAllowRole(role, allowedRoles)) {
        setLoading(false)
        router.replace(fallbackPath || getRoleRedirectPath(role))
        return
      }

      if (requiredPermission && !hasPermission(role, requiredPermission)) {
        setLoading(false)
        router.replace(fallbackPath || getRoleRedirectPath(role))
        return
      }

      setAuthorized(true)
      setLoading(false)
    }

    void checkRole()

    return () => {
      active = false
    }
  }, [allowedKey, requiredPermission, fallbackPath, router])

  return { authorized, loading }
}
