'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  TrendingUp,
  Users,
  Utensils,
  Package,
  Megaphone,
  DollarSign,
  Sparkles,
  Building2,
  Settings,
  ShieldCheck,
  Activity,
  FileText,
} from 'lucide-react'
import { useManagerStore } from '@/lib/managerStore'
import { Badge } from '@/components/ui/badge'

const MANAGER_NAV = [
  { label: 'Executive Dashboard', href: '/manager', icon: BarChart3 },
  { label: 'Live Operations', href: '/manager/monitoring', icon: Activity },
  { label: 'User & Staff RBAC', href: '/manager/users', icon: Users },
  { label: 'Menu & Pricing ERP', href: '/manager/inventory', icon: Utensils },
  { label: 'Raw Inventory', href: '/manager/raw-inventory', icon: Package },
  { label: 'Customer CRM', href: '/manager/crm', icon: Users },
  { label: 'Marketing & Loyalty', href: '/manager/marketing', icon: Megaphone },
  { label: 'Finance & GST', href: '/manager/finance', icon: DollarSign },
  { label: 'AI Business Intelligence', href: '/manager/ai-insights', icon: Sparkles },
  { label: 'Multi-Branch', href: '/manager/branches', icon: Building2 },
  { label: 'Reports & Exports', href: '/manager/reports', icon: FileText },
]

export function ManagerHeader() {
  const pathname = usePathname()
  const { branches, selectedBranchId, setSelectedBranchId } = useManagerStore()

  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0]

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left Branding */}
        <div className="flex items-center gap-4">
          <Link href="/manager" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 font-black text-zinc-950 shadow-md shadow-amber-500/20">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wider text-zinc-100 uppercase">PLATR ERP</span>
                <Badge className="bg-purple-500/10 text-[10px] uppercase text-purple-400 border border-purple-500/30">
                  Business Intelligence
                </Badge>
              </div>
              <p className="text-[11px] font-medium text-zinc-400">Enterprise Restaurant OS</p>
            </div>
          </Link>

          {/* Branch Selector Dropdown */}
          <div className="hidden md:flex items-center gap-2 border-l border-zinc-800 pl-4">
            <Building2 className="h-4 w-4 text-amber-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-zinc-950 text-zinc-100">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Admin Status */}
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> System Operational
          </Badge>
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-1 border-t border-zinc-900 bg-zinc-950 px-4 py-2 text-xs font-bold">
        {MANAGER_NAV.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-2 rounded-xl px-3.5 py-1.5 uppercase transition-all ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/10 font-black'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
