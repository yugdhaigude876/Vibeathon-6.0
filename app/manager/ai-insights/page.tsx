'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  MessageSquare,
  Bot,
  Send,
  LineChart,
  BarChart3,
  Flame,
  ArrowRight,
  BrainCircuit,
  DollarSign,
} from 'lucide-react'
import { useManagerStore } from '@/lib/managerStore'
import { formatINR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PRESETS = [
  'Why did profits decrease today?',
  'Which menu item should I promote?',
  'How much inventory should I purchase tomorrow?',
  'Which employee performed best?',
  "What is today's biggest business risk?",
]

export default function AIInsightsPage() {
  const { insights, forecasts, financials } = useManagerStore()
  const [prompt, setPrompt] = useState('')
  const [chatLog, setChatLog] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: 'Why did profits decrease today?',
      a: 'Labour cost spiked by 4.2% during non-peak hours (3 PM - 6 PM) due to overstaffing, and raw avocado wastage accounted for ₹4,800 in lost margin.',
      time: '14:20 PM',
    },
  ])
  const [isThinking, setIsThinking] = useState(false)

  const handleAskAI = (question: string) => {
    if (!question.trim()) return
    setIsThinking(true)

    setTimeout(() => {
      let answer = 'Analyzing real-time POS telemetry and historical sales patterns...'
      if (question.includes('promote')) {
        answer = 'Promote **Smoked Salmon Carpaccio**! It has a 54.3% profit margin with high guest rating, but needs a wine pairing bundle to boost sales volume.'
      } else if (question.includes('inventory') || question.includes('purchase')) {
        answer = `Forecasted demand for tomorrow requires **15kg San Marzano Tomatoes**, **8kg Mozzarella**, and **12 bottles of Pinot Noir** based on Friday evening reservations.`
      } else if (question.includes('employee') || question.includes('best')) {
        answer = 'Senior Chef **Alex Rivera** processed 42 orders with 0 kitchen delays and a 4.9 star rating today.'
      } else if (question.includes('risk')) {
        answer = 'Critical Risk: San Marzano Tomato stock will hit 0 units by tomorrow 2:00 PM if no replenishment PO is triggered today.'
      } else {
        answer = `Based on current performance, projected revenue for tomorrow is ${formatINR(forecasts.tomorrowRevenue)} across ~${forecasts.tomorrowOrders} orders with peak rush expected at ${forecasts.expectedPeakHour}.`
      }

      setChatLog((prev) => [
        ...prev,
        { q: question, a: answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ])
      setPrompt('')
      setIsThinking(false)
    }, 600)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2.5">
              <Sparkles className="h-7 w-7 text-amber-400" /> AI Executive Assistant & Predictive BI
            </h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Real-time conversational AI, demand forecasting, dynamic pricing, & automated waste reduction.
            </p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 font-bold flex items-center gap-1.5">
            <BrainCircuit className="h-4 w-4 text-amber-400 animate-pulse" /> Gemini AI Engine Online
          </Badge>
        </div>

        {/* AI Conversational Assistant (Executive Q&A) */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 rounded-3xl shadow-xl">
          <CardHeader className="p-5 border-b border-zinc-800">
            <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
              <Bot className="h-5 w-5 text-amber-400" /> Executive AI Business Copilot
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Ask deep operational questions regarding profit dips, staffing, menu promos, or stock risks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Quick Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <span className="text-[11px] text-zinc-400 font-bold uppercase shrink-0">Ask AI:</span>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleAskAI(p)}
                  className="shrink-0 text-xs font-semibold px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-amber-300 hover:border-amber-500/40 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Chat Log */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {chatLog.map((chat, idx) => (
                <div key={idx} className="space-y-2 text-xs">
                  <div className="flex justify-end">
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-2 rounded-2xl max-w-[85%] font-medium">
                      {chat.q}
                    </div>
                  </div>
                  <div className="flex justify-start items-start gap-2.5">
                    <div className="h-7 w-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-2xl max-w-[85%] space-y-1">
                      <p className="leading-relaxed whitespace-pre-line">{chat.a}</p>
                      <span className="text-[10px] text-zinc-500 font-mono block text-right">{chat.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="text-xs text-amber-400 flex items-center gap-2 italic font-mono pl-9">
                  <Sparkles className="h-4 w-4 animate-spin" /> Thinking & calculating telemetry...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Ask any restaurant question (e.g. Why did revenue spike on Friday?)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI(prompt)}
                className="bg-zinc-950 border-zinc-800 text-xs text-zinc-100 focus-visible:ring-amber-500 rounded-xl"
              />
              <Button
                onClick={() => handleAskAI(prompt)}
                className="bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold rounded-xl text-xs px-4"
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Ask
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Predictive Analytics & Forecast Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Tomorrow's Forecasted Sales</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{formatINR(forecasts.tomorrowRevenue)}</p>
                <p className="text-[10px] text-emerald-300 font-semibold mt-1">~{forecasts.tomorrowOrders} projected orders</p>
              </div>
              <LineChart className="h-8 w-8 text-emerald-400/40" />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Recommended Chefs</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{forecasts.recommendedChefs} Chefs</p>
                <p className="text-[10px] text-amber-300 font-semibold mt-1">Peak: {forecasts.expectedPeakHour}</p>
              </div>
              <Flame className="h-8 w-8 text-amber-400/40" />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Waste Risk Forecast</p>
                <p className="text-2xl font-black text-red-400 mt-1">{forecasts.predictedWasteKg} kg</p>
                <p className="text-[10px] text-red-300 font-semibold mt-1">Avocado & Seafood risk</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400/40" />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/80 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Projected Net EBITDA</p>
                <p className="text-2xl font-black text-purple-400 mt-1">{formatINR(financials.totalProfit)}</p>
                <p className="text-[10px] text-purple-300 font-semibold mt-1">{financials.netProfitMargin}% net profit margin</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400/40" />
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((card) => (
            <Card key={card.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden shadow-lg">
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
                    <Lightbulb className="h-3.5 w-3.5" /> Actionable AI Suggestion
                  </span>
                  <p className="text-zinc-200 font-semibold">{card.actionableSuggestion}</p>
                </div>

                {card.predictionMetric && (
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800 pt-2 font-mono">
                    <span>Projected ROI / Outcome:</span>
                    <span className="text-emerald-400 font-bold">{card.predictionMetric}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
