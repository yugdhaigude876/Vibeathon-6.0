'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getCurrentUser, getUserProfile, signIn, signInWithGoogle } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, UserCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Staff & Management credentials
  const [staffId, setStaffId] = useState('')
  const [staffPassword, setStaffPassword] = useState('')

  // Customer credentials (fallback)
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPassword, setCustomerPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (user) {
        const { profile } = await getUserProfile(user.id)
        const role = profile?.role?.toLowerCase() || 'customer'

        if (role === 'manager' || role === 'admin') {
          router.push('/manager')
        } else if (role === 'staff') {
          router.push('/staff')
        } else {
          router.push('/menu')
        }
      } else {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error,
      })
    }
  }, [error, toast])

  async function handleStaffSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Staff / Manager can log in via Staff ID/Email + Password
    const { data, error: signInError } = await signIn(staffId, staffPassword)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      const { profile } = await getUserProfile(data.user.id)
      const role = profile?.role?.toLowerCase()

      if (role === 'manager' || role === 'admin') {
        router.push('/manager')
      } else if (role === 'staff') {
        router.push('/staff')
      } else {
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  }

  async function handleCustomerSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await signIn(customerEmail, customerPassword)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    router.push('/menu')
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    const { data, error: googleError } = await signInWithGoogle()

    if (googleError) {
      setError(googleError.message)
      setLoading(false)
      return
    }

    if (data?.url) {
      window.location.href = data.url
      return
    }

    router.push('/menu')
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:px-6">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">PLATR Portal</CardTitle>
          <CardDescription>Select your account type to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Customer
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Staff & Manager
              </TabsTrigger>
            </TabsList>

            {/* CUSTOMER AUTHENTICATION TAB */}
            <TabsContent value="customer">
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 flex items-center justify-center gap-2 border-slate-300 bg-white text-slate-900 font-medium hover:bg-slate-100 hover:text-slate-900"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  {loading ? 'Redirecting...' : 'Continue with Google'}
                </Button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleCustomerSignIn} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="customer-email" className="text-sm font-medium">
                      Email address
                    </label>
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="name@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="customer-password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="customer-password"
                      type="password"
                      placeholder="••••••••"
                      value={customerPassword}
                      onChange={(e) => setCustomerPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In as Customer'}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-2">
                  New customer?{' '}
                  <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>
            </TabsContent>

            {/* STAFF & MANAGEMENT AUTHENTICATION TAB */}
            <TabsContent value="staff">
              <form onSubmit={handleStaffSignIn} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="staff-id" className="text-sm font-medium">
                    Staff ID / Official Email
                  </label>
                  <Input
                    id="staff-id"
                    type="text"
                    placeholder="e.g. STF-1024 or staff@platr.com"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="staff-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-1">
                  Protected portal for authorized restaurant staff & management.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

