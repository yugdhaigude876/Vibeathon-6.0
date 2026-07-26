'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  ClipboardList,
  Crown,
  Home,
  LogOut,
  Menu,
  UtensilsCrossed,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CartSheet } from '@/components/CartSheet'

interface NavigationProps {
  userEmail: string | null
  onLogout: () => Promise<void>
  children: React.ReactNode
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/menu', label: 'Royal Menu', icon: UtensilsCrossed },
  { href: '/orders', label: 'Orders & Receipts', icon: ClipboardList },
  { href: '/reservations', label: 'Reservations', icon: Calendar },
]

function NavLink({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
        isActive
          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 border border-transparent'
      )}
    >
      <Icon className={cn('h-4 w-4', isActive ? 'text-amber-400' : 'text-zinc-400')} />
      {label}
    </Link>
  )
}

export function Navigation({ userEmail, onLogout, children }: NavigationProps) {
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : '?'

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-amber-500/20 bg-zinc-950/95 backdrop-blur-md">
        <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-zinc-300 hover:bg-zinc-900"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-amber-500/20 bg-zinc-950 text-zinc-50">
                <SheetHeader>
                  <SheetTitle className="text-left text-xl font-bold flex items-center gap-2 gold-gradient-text">
                    <Crown className="h-5 w-5 text-amber-400" />
                    PLATR ROYAL
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1.5">
                  {navLinks.map((link) => (
                    <NavLink key={link.href} {...link} />
                  ))}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50 border border-transparent mt-4"
                  >
                    <LogOut className="h-4 w-4 text-red-400" />
                    Logout
                  </button>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/menu" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
                <Crown className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-xl font-extrabold gold-gradient-text tracking-wider">
                PLATR
              </span>
            </Link>
          </div>

          <div className="flex justify-center px-2">
            {userEmail && (
              <>
                <p className="hidden truncate text-xs text-amber-200/70 sm:block bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  👑 {userEmail}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="sm:hidden text-zinc-50 hover:bg-zinc-800"
                    >
                      <Avatar className="h-8 w-8 border border-amber-500/30">
                        <AvatarFallback className="bg-amber-950 text-amber-300 text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="border-amber-500/30 bg-zinc-900 text-zinc-50"
                  >
                    <DropdownMenuItem disabled className="text-zinc-400">
                      {userEmail}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <CartSheet />
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-amber-500/15 bg-zinc-950/80 md:block">
          <nav className="flex flex-col gap-1.5 p-4">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-red-400 border border-transparent mt-6"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-4 pb-20 sm:p-6 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Persistent Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-amber-500/20 bg-zinc-950/95 px-2 py-1.5 backdrop-blur-md md:hidden">
        {navLinks.map((link) => {
          const Icon = link.icon
          const pathname = usePathname()
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-amber-400' : 'text-zinc-400')} />
              <span className="text-[10px] tracking-tight">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
