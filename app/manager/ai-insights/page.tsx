'use client'

import React from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap } from 'lucide-react'

export default function AIInsightsPage() {
  const { insights } = useManagerStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <ManagerHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" /> AI Business Intelligence & Predictive Analytics
            </h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Demand forecasting, food waste predictions, dynamic pricing recommendations, and automated restocking.
            </p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
            Gemini AI Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((card) => (
            <Card key={card.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-amber-400">{card.title}</CardTitle>
                  <Badge className="bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold mt-1">
                    {card.category}
                  </Badge>
                </div>
                <Badge
                  className={`text-xs font-bold ${
                    card.impact === 'Critical'
                      ? 'bg-red-500/20 text-red-400'
                      : card.impact === 'High'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {card.impact} Impact
                </Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                <p className="text-zinc-300 leading-relaxed">{card.description}</p>

                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3 text-amber-300 space-y-1">
                  <span className="font-extrabold uppercase text-[10px] text-amber-400 flex items-center gap-1">
                    <Lightbulb className="h-3.5 w-3.5" /> Actionable Suggestion
                  </span>
                  <p className="text-xs">{card.actionableSuggestion}</p>
                </div>

                <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-xl mt-2">
                  Execute Recommendation
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
