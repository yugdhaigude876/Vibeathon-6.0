'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

import { getCurrentUser, signOut } from '@/lib/auth'
import { Navigation } from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'

import { CartProvider } from '@/context/CartContext'

import './globals.css'

const AUTH_ROUTES = ['/login', '/signup']

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)

      if (!currentUser && !AUTH_ROUTES.includes(pathname)) {
        router.push('/login')
      }

      setLoading(false)
    }

    setLoading(true)
    checkAuth()
  }, [pathname, router])

  const handleLogout = useCallback(async () => {
    await signOut()
    setUser(null)
    router.push('/login')
  }, [router])

  if (loading) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        </body>
      </html>
    )
  }

  if (isAuthRoute) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
          <CartProvider>
            <Toaster />
            {children}
          </CartProvider>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <CartProvider>
          <Toaster />
          <Navigation userEmail={user?.email ?? null} onLogout={handleLogout}>
            {children}
          </Navigation>
        </CartProvider>
      </body>
    </html>
  )
}
