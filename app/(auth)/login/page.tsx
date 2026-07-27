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
import { ShieldCheck, Sparkles, UserCheck } from 'lucide-react'

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
    setCheckingAuth(false)
  }, [])

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

    const inputClean = staffId.trim().toLowerCase()

    // 1. Try Supabase Authentication first
    const { data, error: signInError } = await signIn(staffId, staffPassword)

    if (data?.user) {
      const { profile } = await getUserProfile(data.user.id)
      const role = (profile?.role || (data.user.user_metadata?.role as string) || 'customer').toLowerCase()

      if (role === 'manager' || role === 'admin') {
        toast({ title: 'Welcome Manager!', description: 'Logged into Manager ERP Dashboard.' })
        window.location.href = '/manager'
        return
      } else if (role === 'staff' || role === 'chef' || role === 'cashier' || role === 'waiter' || role === 'delivery') {
        toast({ title: 'Welcome Staff!', description: 'Logged into Staff POS System.' })
        window.location.href = '/staff/kitchen'
        return
      }
    }

    // 2. Demo fallback for quick access emails/IDs
    if (
      inputClean.includes('manager') ||
      inputClean.includes('mng') ||
      inputClean === 'admin@platr.com'
    ) {
      toast({ title: 'Welcome Manager!', description: 'Logged into Manager ERP Dashboard (Demo).' })
      window.location.href = '/manager'
      return
    }

    if (
      inputClean.includes('staff') ||
      inputClean.includes('stf') ||
      inputClean.includes('chef') ||
      inputClean.includes('waiter') ||
      inputClean.includes('cashier') ||
      inputClean.includes('delivery') ||
      inputClean === 'my.staff@platr.com' ||
      inputClean === 'staff@platr.com'
    ) {
      toast({ title: 'Welcome Staff!', description: 'Logged into Staff POS System (Demo).' })
      window.location.href = '/staff/kitchen'
      return
    }

    const errStr = signInError ? (typeof signInError === 'string' ? signInError : signInError.message || 'Invalid email or password') : 'Invalid credentials'
    setError(errStr)
    setLoading(false)
  }

  async function handleCustomerSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Enforce 100% Strict Supabase Password Verification
    const { data, error: signInError } = await signIn(customerEmail, customerPassword)

    if (signInError || !data?.user) {
      const errStr = signInError ? (typeof signInError === 'string' ? signInError : signInError.message || 'Invalid email or password') : 'Invalid email or password'
      setError(errStr)
      setLoading(false)
      return
    }

    const { profile } = await getUserProfile(data.user.id)
    const role = (profile?.role || (data.user.user_metadata?.role as string) || 'customer').toLowerCase()

    if (role === 'manager' || role === 'admin') {
      window.location.href = '/manager'
    } else if (role === 'staff' || role === 'chef' || role === 'cashier' || role === 'waiter' || role === 'delivery') {
      window.location.href = '/staff/kitchen'
    } else {
      window.location.href = '/menu'
    }
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
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 overflow-hidden">
      <Toaster />

      {/* Decorative Background Orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-[128px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-amber-600/10 blur-[128px]" />

      {/* Left Branding / Hero Side (Visible on large screens) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-zinc-900 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-zinc-950 text-xl shadow-lg shadow-amber-500/20">
            P
          </div>
          <span className="text-xl font-bold tracking-wider text-zinc-50 uppercase">PLATR</span>
        </div>

        <div className="my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            Vibeathon 6.0 Experience
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-zinc-50 leading-[1.15]">
            Seamless dining, <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">effortless management.</span>
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed">
            Welcome to PLATR — the modern culinary OS for instant digital ordering, live table management, and AI-driven kitchen operations.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900 pt-6">
          <span>© 2026 PLATR Inc.</span>
          <span>Crafted for Vibeathon</span>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 z-10">
        <Card className="w-full max-w-md border-zinc-800/80 bg-zinc-900/80 shadow-2xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="space-y-2 text-center pb-4">
            {/* Mobile Logo Branding */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-black text-zinc-950 text-base">
                P
              </div>
              <span className="text-lg font-bold tracking-wider text-zinc-50 uppercase">PLATR</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-zinc-50">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-400 text-sm">Select your portal role to log in</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-950/80 p-1 border border-zinc-800 rounded-xl">
                <TabsTrigger
                  value="customer"
                  className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-400 transition-all"
                >
                  <UserCheck className="h-4 w-4" />
                  Customer
                </TabsTrigger>
                <TabsTrigger
                  value="staff"
                  className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 text-zinc-400 transition-all"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Staff & Manager
                </TabsTrigger>
              </TabsList>

              {/* CUSTOMER TAB */}
              <TabsContent value="customer" className="space-y-5 focus-visible:outline-none">
                <Button
                  type="button"
                  className="w-full h-11 flex items-center justify-center gap-3 border border-zinc-700 bg-white text-zinc-950 font-bold hover:bg-zinc-100 transition-all rounded-xl shadow-md"
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
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-semibold">
                    <span className="bg-zinc-900 px-3 text-zinc-500">Or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleCustomerSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="customer-email" className="text-xs font-semibold text-zinc-300">
                      Email Address
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
                      className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-11 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="customer-password" className="text-xs font-semibold text-zinc-300">
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
                      className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-11 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In as Customer'}
                  </Button>
                </form>

                <p className="text-center text-xs text-zinc-400 mt-3">
                  New customer?{' '}
                  <Link href="/signup" className="font-semibold text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </TabsContent>

              {/* STAFF & MANAGEMENT TAB */}
              <TabsContent value="staff" className="space-y-4 focus-visible:outline-none">
                <form onSubmit={handleStaffSignIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="staff-id" className="text-xs font-semibold text-zinc-300">
                      Staff ID or Official Email
                    </label>
                    <Input
                      id="staff-id"
                      type="text"
                      placeholder="e.g. STF-1024 or staff@platr.com"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      required
                      disabled={loading}
                      className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-11 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="staff-password" className="text-xs font-semibold text-zinc-300">
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
                      className="bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl h-11 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                    disabled={loading}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  </Button>

                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
