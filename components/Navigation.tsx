'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  ClipboardList,
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

interface NavigationProps {
  userEmail: string | null
  onLogout: () => Promise<void>
  children: React.ReactNode
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/orders', label: 'Orders', icon: ClipboardList },
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
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-amber-600/20 text-amber-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

export function Navigation({ userEmail, onLogout, children }: NavigationProps) {
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : '?'

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="grid h-14 grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-zinc-50 hover:bg-zinc-800"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-zinc-800 bg-zinc-950 text-zinc-50">
                <SheetHeader>
                  <SheetTitle className="text-left text-xl font-bold">PLATR</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <NavLink key={link.href} {...link} />
                  ))}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
            <span className="text-xl font-bold text-zinc-50">PLATR</span>
          </div>

          <div className="flex justify-center px-2">
            {userEmail && (
              <>
                <p className="hidden truncate text-sm text-zinc-400 sm:block">{userEmail}</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="sm:hidden text-zinc-50 hover:bg-zinc-800"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="border-zinc-800 bg-zinc-900 text-zinc-50"
                  >
                    <DropdownMenuItem disabled className="text-zinc-400">
                      {userEmail}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-zinc-700 bg-transparent text-zinc-50 hover:bg-zinc-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 md:block">
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
