'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { signOut } from '@/lib/auth'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    async function logout() {
      await signOut()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      router.push('/login')
    }

    logout()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-400">Logging out...</p>
    </div>
  )
}
