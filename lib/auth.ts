import type {
  AuthError,
  AuthTokenResponsePassword,
  OAuthResponse,
  PostgrestError,
  User,
} from '@supabase/supabase-js'

import { createClient } from './supabase'
import { getRoleRedirectPath, isStaffRole } from './services/roleService'
import { UserProfile, UserRole } from './types/auth'

export interface Profile extends UserProfile {}

export async function signUp(
  email: string,
  password: string
): Promise<{ user: User | null; error: AuthError | null }> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { user: data.user, error }
}

export async function signIn(
  email: string,
  password: string
): Promise<{
  data: AuthTokenResponsePassword['data']
  error: AuthError | null
}> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle(): Promise<{
  data: OAuthResponse['data']
  error: AuthError | null
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
    return {
      data: { provider: 'google', url: null },
      error: {
        name: 'AuthConfigurationError',
        message: 'Supabase URL is not configured on Vercel. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project Settings.',
        status: 400,
      } as unknown as AuthError,
    }
  }

  const supabase = createClient()
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : undefined
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  })

  if (data?.url && data.url.includes('placeholder.supabase.co')) {
    return {
      data: { provider: 'google', url: null },
      error: {
        name: 'AuthConfigurationError',
        message: 'Supabase URL is set to a placeholder on Vercel. Please configure valid Supabase keys in Vercel Settings.',
        status: 400,
      } as unknown as AuthError,
    }
  }

  return { data, error }
}

export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(
  userId: string
): Promise<{ profile: Profile | null; error: PostgrestError | null }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    return { profile: null, error }
  }

  return {
    profile: {
      id: data.id,
      email: data.email,
      full_name: data.full_name || null,
      avatar_url: data.avatar_url || null,
      role: (data.role?.toLowerCase() as UserRole) || 'customer',
      branch: data.branch || null,
      department: data.department || null,
      status: data.status || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
    error: null,
  }
}

export { getRoleRedirectPath, isStaffRole }
