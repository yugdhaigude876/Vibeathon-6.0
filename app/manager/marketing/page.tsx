'use client'

import React from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, Tag, Gift, Zap, Sparkles } from 'lucide-react'

export default function MarketingPage() {
  const { campaigns } = useManagerStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <ManagerHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Marketing & Loyalty Campaigns</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Manage promo codes, coupon redemptions, flash sales, and festival offers.
            </p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl">
            <Megaphone className="mr-1.5 h-4 w-4" /> Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <Card key={c.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-amber-400">{c.name}</CardTitle>
                  <p className="text-xs text-zinc-400 font-mono font-bold mt-1">Code: {c.code}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 text-xs font-bold">{c.discount}</Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Total Redemptions</span>
                  <span className="font-bold text-zinc-100 font-mono">{c.redemptions}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Revenue Generated</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{c.revenueGenerated.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">{c.status}</Badge>
                  <Button size="sm" variant="outline" className="border-zinc-800 text-[10px] font-bold rounded-lg">
                    Edit Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
