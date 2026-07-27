import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getRoleRedirectPath } from '@/lib/services/roleService'
import { UserRole } from '@/lib/types/auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = request.cookies
    const response = NextResponse.redirect(`${origin}/menu`)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Fetch existing profile to preserve user role
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        let userRole: UserRole = (existingProfile?.role?.toLowerCase() as UserRole) || 'customer'

        // Upsert profile without overwriting existing role if present
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          role: userRole,
        })

        const targetDestination = getRoleRedirectPath(userRole)
        return NextResponse.redirect(`${origin}${targetDestination}`)
      }

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
