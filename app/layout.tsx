'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { getCurrentUser, signOut } from '@/lib/auth'
import { Navigation } from '@/components/Navigation'
import { AIAssistant } from '@/components/AIAssistant'
import { Toaster } from '@/components/ui/toaster'
import { PageTransition } from '@/components/PageTransition'
import { CartProvider } from '@/context/CartContext'

import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isManagerRoute = pathname.startsWith('/manager')
  const isStaffRoute = pathname.startsWith('/staff')

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [pathname])

  const handleLogout = useCallback(async () => {
    await signOut()
    setUser(null)
    router.push('/login')
  }, [router])

  // Manager and Staff routes render with their own dedicated portal layouts
  if (isAuthRoute || isManagerRoute || isStaffRoute) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
          <CartProvider>
            <Toaster />
            <PageTransition>{children}</PageTransition>
          </CartProvider>
        </body>
      </html>
    )
  }

  // Customer routes render with Customer Navigation
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <CartProvider>
          <Toaster />
          <Navigation userEmail={user?.email ?? null} onLogout={handleLogout}>
            <PageTransition>{children}</PageTransition>
          </Navigation>
          <AIAssistant role="customer" />
        </CartProvider>
      </body>
    </html>
  )
}
