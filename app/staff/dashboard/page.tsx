'use client'

import React, { useState } from 'react'
import {
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Truck,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Search,
  SlidersHorizontal,
  Flame,
  UserCheck,
  Award,
  Zap,
  Coffee,
  PlusCircle,
  Package,
} from 'lucide-react'
import { useStaffStore } from '@/lib/staffStore'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function StaffDashboardPage() {
  const {
    profile,
    orders,
    tables,
    requests,
    inventoryAlerts,
    performance,
    updateOrderStatus,
    updateRequestStatus,
    toggleStockStatus,
  } = useStaffStore()

  const [searchQuery, setSearchQuery] = useState('')

  // Computed metrics
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length
  const completedCount = orders.filter((o) => o.status === 'delivered').length
  const totalOrdersToday = orders.length

  const filteredOrders = orders.filter(
    (o) =>
      o.displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.tableNumber && String(o.tableNumber).toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Welcome & Shift Overview Banner */}
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-amber-950/40 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ChefHat className="w-64 h-64 text-amber-400" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-2xl border-2 border-amber-500/50 object-cover shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-zinc-100">{profile.name}</h1>
                  <Badge className="bg-amber-500 text-zinc-950 font-bold uppercase text-xs">
                    {profile.role}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-zinc-400 mt-1">
                  Branch: <span className="text-zinc-200">{profile.branch}</span> | Shift:{' '}
                  <span className="text-amber-400">{profile.shift}</span>
                </p>
              </div>
            </div>

            {/* Quick Performance Summary Badge */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Efficiency</span>
                <p className="text-lg font-black text-amber-400">{performance.efficiencyScore}%</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg Prep</span>
                <p className="text-lg font-black text-emerald-400">{performance.avgCookingTimeMins}m</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rating</span>
                <p className="text-lg font-black text-amber-300">★ {performance.customerRating}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Leaderboard</span>
                <p className="text-lg font-black text-purple-400">#{performance.rank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Order Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Today Total</p>
                <p className="text-2xl font-black text-zinc-100">{totalOrdersToday}</p>
              </div>
              <TrendingUp className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Pending</p>
                <p className="text-2xl font-black text-blue-400">{pendingCount}</p>
              </div>
              <Clock className="h-7 w-7 text-blue-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Preparing</p>
                <p className="text-2xl font-black text-amber-400">{preparingCount}</p>
              </div>
              <Flame className="h-7 w-7 text-amber-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Ready</p>
                <p className="text-2xl font-black text-emerald-400">{readyCount}</p>
              </div>
              <CheckCircle2 className="h-7 w-7 text-emerald-400/60" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Completed</p>
                <p className="text-2xl font-black text-purple-400">{completedCount}</p>
              </div>
              <Award className="h-7 w-7 text-purple-400/60" />
            </CardContent>
          </Card>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Live Orders Feed & Status Workflow */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wide">Live Orders Feed</h2>
              </div>
              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search order ID or table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-amber-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((ord) => (
                <Card key={ord.id} className="border border-zinc-800/80 bg-zinc-900/60 rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-amber-400">{ord.displayId}</span>
                          {ord.isVip && (
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-extrabold">
                              VIP Guest
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] uppercase font-bold">
                            {ord.orderType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-zinc-300 mt-1">
                          {ord.customerName} {ord.tableNumber ? `• Table ${ord.tableNumber}` : ''}
                        </p>
                      </div>

                      <Badge
                        className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                          ord.status === 'pending'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : ord.status === 'preparing'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : ord.status === 'ready'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {ord.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Ordered Items List */}
                    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3 space-y-1.5">
                      {ord.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-200">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-zinc-400 font-mono">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {ord.specialInstructions && (
                      <p className="text-xs text-amber-400/90 font-medium italic bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
                        Instruction: {ord.specialInstructions}
                      </p>
                    )}

                    {/* Workflow One-Click Advance Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <span className="text-[11px] font-bold text-zinc-400">Total: ₹{ord.totalAmount}</span>
                      <div className="flex gap-2">
                        {ord.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(ord.id, 'preparing')}
                            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl h-8"
                          >
                            Accept & Start Prep
                          </Button>
                        )}
                        {ord.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(ord.id, 'ready')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl h-8"
                          >
                            Mark Ready
                          </Button>
                        )}
                        {ord.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(ord.id, 'delivered')}
                            className="bg-purple-500 hover:bg-purple-600 text-zinc-100 text-xs font-bold rounded-xl h-8"
                          >
                            Complete Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: Customer Requests & Inventory Alerts */}
          <div className="space-y-6">
            {/* Customer Requests Ticket Queue */}
            <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-400" /> Customer Requests
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-400 text-xs">{requests.filter(r => r.status === 'pending').length} Pending</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400">{req.tableNumber} • {req.type}</span>
                      <span className="text-[10px] text-zinc-500">{req.time}</span>
                    </div>
                    {req.note && <p className="text-xs text-zinc-300 italic">{req.note}</p>}
                    <div className="flex justify-end gap-2 pt-1">
                      {req.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestStatus(req.id, 'completed')}
                          className="h-7 text-[10px] font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-zinc-950"
                        >
                          Resolve Request
                        </Button>
                      )}
                      {req.status === 'completed' && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Inventory Alerts Box */}
            <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-400" /> Stock Out Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                {inventoryAlerts.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{inv.ingredient}</p>
                      <p className="text-[10px] text-zinc-400">Remaining: <span className="text-red-400 font-bold">{inv.remainingQty}</span></p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => toggleStockStatus(inv.id)}
                      className={`h-7 text-[10px] font-bold rounded-lg ${
                        inv.isOutOfStock
                          ? 'bg-red-500 text-zinc-100'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {inv.isOutOfStock ? "86'd Out" : 'In Stock'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
