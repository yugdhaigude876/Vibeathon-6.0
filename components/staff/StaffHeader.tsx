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
  User,
} from 'lucide-react'
import { useStaffStore } from '@/lib/staffStore'
import { StaffRole, StaffNotification } from '@/lib/staffTypes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ROLE_NAVIGATION: { role: StaffRole; label: string; href: string; icon: React.ElementType }[] = [
  { role: 'chef', label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
  { role: 'chef', label: 'Kitchen KDS', href: '/staff/kitchen', icon: ChefHat },
  { role: 'cashier', label: 'Cashier POS', href: '/staff/cashier', icon: Receipt },
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

  const unreadCount = notifications.filter((n: StaffNotification) => !n.read).length

  // Clean name without extra parenthesis clutter
  const cleanName = profile.name.replace(/^(Rider|Chef|Waiter|Cashier)\s+/i, '').replace(/\(.*\)/, '').trim() || profile.name

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur-2xl shadow-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Clean Brand & Branch Header */}
        <div className="flex items-center gap-6">
          <Link href="/staff/dashboard" className="flex items-center gap-3.5 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition duration-300 group-hover:scale-105">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  LUFT POS
                </span>
                <Badge className="bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 shadow-sm">
                  ENTERPRISE
                </Badge>
              </div>
              <p className="text-[11px] font-semibold text-zinc-400 mt-0.5">
                {profile.branch}
              </p>
            </div>
          </Link>

          {/* Role Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md">
            {ROLE_NAVIGATION.map((nav) => {
              const Icon = nav.icon
              const isActive = pathname === nav.href
              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_4px_15px_rgba(212,175,55,0.3)]'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{nav.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Status Controls & Staff Profile */}
        <div className="flex items-center gap-3">
          {/* Notifications Popover */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-2xl border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100 h-10 w-10 p-0 shadow-md"
            >
              <Bell className="h-4 w-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-[10px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[2rem] border border-white/10 bg-zinc-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-extrabold text-sm text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" /> Notifications
                  </span>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">No active notifications</p>
                  ) : (
                    notifications.map((n: StaffNotification) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`rounded-2xl border p-3 cursor-pointer transition ${
                          n.read
                            ? 'border-white/5 bg-white/5 opacity-60'
                            : 'border-amber-500/40 bg-amber-950/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300">{n.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Break Timer Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleBreak}
            className={`rounded-2xl border text-xs font-bold transition-all h-10 px-3.5 ${
              profile.breakStatus === 'break'
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <Coffee className="h-4 w-4 mr-1.5 text-amber-400" />
            {profile.breakStatus === 'break'
              ? `Break (${formatBreakTime(profile.breakSeconds)})`
              : 'Break'}
          </Button>

          {/* Clock In / Out Toggle */}
          <Button
            onClick={toggleClockIn}
            className={`rounded-2xl text-xs font-black uppercase px-4 h-10 transition-all ${
              profile.clockedIn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:brightness-110'
                : 'bg-gradient-to-r from-red-600 to-red-700 text-zinc-100 shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:brightness-110'
            }`}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            {profile.clockedIn ? `Clocked In` : 'Clock In'}
          </Button>

          {/* Clean Profile Badge */}
          <div className="hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-1.5 pl-2.5">
            <div className="text-right text-xs">
              <p className="font-extrabold text-zinc-100 leading-tight">{cleanName}</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{profile.role}</p>
            </div>
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="h-8 w-8 rounded-xl border border-amber-500/40 object-cover shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
