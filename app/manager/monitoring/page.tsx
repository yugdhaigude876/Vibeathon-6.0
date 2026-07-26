'use client'

import React from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  ChefHat,
  Receipt,
  Truck,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react'

export default function LiveMonitoringPage() {
  const { branches, selectedBranchId } = useManagerStore()
  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <ManagerHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Live Restaurant Operations Monitoring</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Real-time floor telemetry: Active kitchen orders, table occupancy, delivery dispatch, & staff status.
            </p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Telemetry Stream Active
          </Badge>
        </div>

        {/* Real-time Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Active Kitchen Orders</p>
                <p className="text-2xl font-black text-amber-400">14</p>
              </div>
              <ChefHat className="h-8 w-8 text-amber-400/50" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Floor Table Occupancy</p>
                <p className="text-2xl font-black text-purple-400">{currentBranch.tableOccupancyRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400/50" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Staff Online</p>
                <p className="text-2xl font-black text-emerald-400">8 Staff</p>
              </div>
              <Users className="h-8 w-8 text-emerald-400/50" />
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Delayed Orders</p>
                <p className="text-2xl font-black text-red-400">1 Order</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400/50" />
            </CardContent>
          </Card>
        </div>

        {/* Live Telemetry Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-amber-400" /> Active Kitchen Workload
              </CardTitle>
              <Badge className="bg-amber-500/20 text-amber-300 text-xs">Live KDS Sync</Badge>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {[
                { id: '#LUFT-101', table: 'Table T-04', items: '2x Butter Chicken Tacos, 1x Dimsum', time: '8m elapsed', status: 'preparing', urgent: true },
                { id: '#LUFT-102', table: 'Delivery #402', items: '1x Grande Burrito Bowl, 1x Quesadilla', time: '3m elapsed', status: 'pending', urgent: false },
                { id: '#LUFT-103', table: 'Table T-02', items: '2x Avocado Tostadas, 2x Sushi Roll', time: '15m elapsed', status: 'ready', urgent: false },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400 text-sm">{item.id}</span>
                      <span className="font-semibold text-zinc-300">• {item.table}</span>
                      {item.urgent && <Badge className="bg-red-500/20 text-red-400 text-[10px]">Delayed</Badge>}
                    </div>
                    <p className="text-zinc-400 mt-1">{item.items}</p>
                  </div>
                  <Badge className="bg-zinc-800 text-zinc-300 text-[10px] uppercase">{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-400" /> Pending Guest Requests
              </CardTitle>
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">Live Floor</Badge>
            </CardHeader>
            <CardContent className="p-0 pt-4 space-y-3">
              {[
                { table: 'Table T-04', req: 'Wine Pairing Recommendation', priority: 'High', staff: 'Simran Kaur' },
                { table: 'Table T-01', req: 'Extra Chipotle Mayo', priority: 'Normal', staff: 'Rahul Verma' },
                { table: 'Table T-04', req: 'Birthday Candle & Song Prep', priority: 'Urgent', staff: 'Unassigned' },
              ].map((r, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs">
                  <div>
                    <span className="font-bold text-purple-400">{r.table}</span> — <span className="text-zinc-200">{r.req}</span>
                    <p className="text-[10px] text-zinc-500 mt-1">Assigned: {r.staff}</p>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">{r.priority}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
