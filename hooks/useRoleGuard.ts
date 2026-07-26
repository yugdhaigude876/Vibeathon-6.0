'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type AllowedRole = 'customer' | 'staff' | 'manager' | 'authenticated'

function shouldAllowRole(role: string, allowedRoles: AllowedRole[]) {
  const normalizedRole = String(role || '').toLowerCase()

  if (normalizedRole === 'admin') {
    return allowedRoles.includes('authenticated') || allowedRoles.some((allowed) => allowed === 'staff' || allowed === 'manager')
  }

  if (allowedRoles.includes('authenticated')) {
    return normalizedRole === 'customer' || normalizedRole === 'staff' || normalizedRole === 'manager' || normalizedRole === 'admin'
  }

  return allowedRoles.includes(normalizedRole as AllowedRole)
}

export function useRoleGuard(allowedRoles: AllowedRole[], fallbackPath = '/dashboard') {
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
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const role = String(profile?.role || user.user_metadata?.role || 'customer').toLowerCase()

      if (!shouldAllowRole(role, allowedRoles)) {
        router.replace(fallbackPath)
        return
      }

      setAuthorized(true)
      setLoading(false)
    }

    void checkRole()

    return () => {
      active = false
    }
  }, [allowedKey, fallbackPath, router])

  return { authorized, loading }
}
