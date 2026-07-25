'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { getCurrentUser, signIn, signInWithGoogle } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (user) {
        router.push('/menu')
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

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await signIn(email, password)

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
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl">PLATR Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={handleGoogleSignIn}
            >
              {loading ? 'Redirecting...' : 'Sign in with Google'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
