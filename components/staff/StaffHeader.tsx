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
    <header className="sticky top-0 z-50 border-b border-amber-500/10 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex h-20 max-w-[1700px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Left: Brand & Branch Info */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/staff/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition duration-300 group-hover:scale-105">
              <ChefHat className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  LUFT POS
                </span>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-amber-400">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-400 truncate max-w-[180px] sm:max-w-none">
                {profile.branch}
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5 shadow-inner">
          {ROLE_NAVIGATION.map((nav) => {
            const Icon = nav.icon
            const isActive = pathname === nav.href
            return (
              <Link
                key={nav.href}
                href={nav.href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37] via-[#F1C85C] to-[#B68A25] text-zinc-950 shadow-[0_4px_16px_rgba(212,175,55,0.35)] font-extrabold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{nav.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions & Staff Profile */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Status Controls Container */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100 transition shadow-sm"
                title="Notifications"
              >
                <Bell className="h-4 w-4 text-amber-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-[9px] font-black text-white shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="font-extrabold text-xs text-zinc-100 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Notifications
                    </span>
                    <button
                      onClick={clearAllNotifications}
                      className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No active notifications</p>
                    ) : (
                      notifications.map((n: StaffNotification) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`rounded-xl border p-2.5 cursor-pointer transition ${
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

            {/* Break Toggle Button */}
            <button
              type="button"
              onClick={toggleBreak}
              className={`flex items-center gap-1.5 h-9 rounded-xl border px-3 text-xs font-bold transition ${
                profile.breakStatus === 'break'
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-zinc-100'
              }`}
            >
              <Coffee className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {profile.breakStatus === 'break'
                  ? `Break (${formatBreakTime(profile.breakSeconds)})`
                  : 'Break'}
              </span>
            </button>

            {/* Clocked In / Out Button */}
            <button
              type="button"
              onClick={toggleClockIn}
              className={`flex items-center gap-1.5 h-9 rounded-xl px-3.5 text-xs font-extrabold uppercase tracking-wide transition shadow-md ${
                profile.clockedIn
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-zinc-950 shadow-emerald-950/40 hover:brightness-110'
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-950/40 hover:brightness-110'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{profile.clockedIn ? 'Clocked In' : 'Clock In'}</span>
            </button>
          </div>

          {/* Staff Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5 pl-3 shadow-sm">
            <div className="text-right">
              <p className="text-xs font-extrabold text-zinc-100 leading-none">{cleanName}</p>
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">
                {profile.role}
              </span>
            </div>
            <div className="relative">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-8 w-8 rounded-xl border border-amber-500/40 object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
            </div>
          </div>

        </div>
      </div>
    </header>
  )
}
