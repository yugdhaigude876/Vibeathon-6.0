'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Truck,
  LayoutDashboard,
  Clock,
  Bell,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react'
import { useStaffStore } from '@/lib/staffStore'
import { StaffRole } from '@/lib/staffTypes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ROLE_NAVIGATION: { role: StaffRole; label: string; href: string; icon: React.ElementType }[] = [
  { role: 'chef', label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { role: 'chef', label: 'Kitchen KDS', href: '/staff/kitchen', icon: ChefHat },
  { role: 'cashier', label: 'Cashier & POS', href: '/staff/cashier', icon: Receipt },
  { role: 'waiter', label: 'Waiter Tables', href: '/staff/waiter', icon: UtensilsCrossed },
  { role: 'delivery', label: 'Delivery Dispatch', href: '/staff/delivery', icon: Truck },
]

export function StaffHeader() {
  const pathname = usePathname()
  const {
    profile,
    setRole,
    toggleClockIn,
    toggleBreak,
    incrementBreakSeconds,
    notifications,
    markNotificationRead,
    clearAllNotifications,
  } = useStaffStore()

  const [showNotifications, setShowNotifications] = useState(false)

  // Live Break Timer Tick Effect
  useEffect(() => {
    if (profile.breakStatus !== 'break') return
    const interval = setInterval(() => {
      incrementBreakSeconds()
    }, 1000)
    return () => clearInterval(interval)
  }, [profile.breakStatus, incrementBreakSeconds])

  const formatBreakTime = (totalSecs: number = 0) => {
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left Branding & Role Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/staff/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 font-black text-zinc-950 shadow-md shadow-amber-500/20">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider text-zinc-100 uppercase">LUFT POS</span>
                <Badge className="bg-amber-500/10 text-[10px] uppercase text-amber-400 border border-amber-500/30">
                  Enterprise POS
                </Badge>
              </div>
              <p className="text-[11px] font-medium text-zinc-400">{profile.branch}</p>
            </div>
          </Link>

          {/* Quick Role Switcher Dropdown */}
          <div className="hidden items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 md:flex">
            <span className="px-2 text-xs font-semibold text-zinc-400">Role View:</span>
            {(['chef', 'cashier', 'waiter', 'delivery'] as StaffRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition-all ${
                  profile.role === r
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Center Role Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {ROLE_NAVIGATION.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Shift Control & Staff Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-9 w-9 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-zinc-100 rounded-xl"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-zinc-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Staff Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-200"
                    >
                      Clear All
                    </button>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="h-4 w-4 text-zinc-400 hover:text-zinc-100" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        !n.read
                          ? 'border-amber-500/30 bg-amber-950/20 text-zinc-100'
                          : 'border-zinc-800/60 bg-zinc-900/40 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{n.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500">{n.timestamp}</span>
                      </div>
                      <p className="text-xs mt-1 text-zinc-300 leading-snug">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shift Clock-in & Break Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleClockIn}
              className={`h-9 border-zinc-800 font-semibold text-xs rounded-xl ${
                profile.clockedIn
                  ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                  : 'border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-950/40'
              }`}
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              {profile.clockedIn ? `Clocked In (${profile.clockInTime})` : 'Clocked Out'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleBreak}
              className={`h-9 border-zinc-800 font-semibold text-xs rounded-xl ${
                profile.breakStatus === 'break'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 font-extrabold animate-pulse'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Coffee className="mr-1.5 h-3.5 w-3.5" />
              {profile.breakStatus === 'break'
                ? `On Break (${formatBreakTime(profile.breakSeconds)})`
                : 'Take Break'}
            </Button>
          </div>

          {/* User Profile Summary */}
          <div className="hidden sm:flex items-center gap-2.5 border-l border-zinc-800 pl-3">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-9 w-9 rounded-xl border border-amber-500/40 object-cover shadow-sm"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-100 leading-none">{profile.name}</p>
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
                {profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex items-center justify-around border-t border-zinc-900 bg-zinc-950 px-2 py-2 lg:hidden">
        {ROLE_NAVIGATION.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                isActive ? 'text-amber-400' : 'text-zinc-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label.split(' ')[0]}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
