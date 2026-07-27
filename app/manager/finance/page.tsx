'use client'

import React, { useState } from 'react'
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ShieldCheck,
  CreditCard,
  Percent,
} from 'lucide-react'
import { useManagerStore } from '@/lib/managerStore'
import { formatINR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const MONTHLY_COMPARISON = [
  { month: 'Apr 2026', revenue: 3450000, expenses: 2310000, profit: 1140000, margin: '33.0%' },
  { month: 'May 2026', revenue: 3820000, expenses: 2540000, profit: 1280000, margin: '33.5%' },
  { month: 'Jun 2026', revenue: 3950000, expenses: 2610000, profit: 1340000, margin: '33.9%' },
  { month: 'Jul 2026 (MTD)', revenue: 4120000, expenses: 2796000, profit: 1324000, margin: '32.1%' },
]

const INVOICES = [
  { id: 'INV-2026-001', vendor: 'FreshFarm Produce Co.', category: 'Food & Raw Materials', amount: 84500, date: '2026-07-25', status: 'Paid', method: 'Bank Transfer' },
  { id: 'INV-2026-002', vendor: 'MahaDiscom Electricity', category: 'Utilities', amount: 42100, date: '2026-07-20', status: 'Paid', method: 'Auto-Debit' },
  { id: 'INV-2026-003', vendor: 'United Beverage Distro', category: 'Liquor & Spirits', amount: 125000, date: '2026-07-26', status: 'Pending', method: 'Net 30 Days' },
  { id: 'INV-2026-004', vendor: 'BioClean Hygiene Solutions', category: 'Sanitation', amount: 14200, date: '2026-07-22', status: 'Paid', method: 'UPI Corporate' },
]

export default function FinancialERPPage() {
  const { financials } = useManagerStore()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month')

  const currentRev =
    selectedPeriod === 'today'
      ? financials.revenueToday
      : selectedPeriod === 'week'
      ? financials.revenueThisWeek
      : financials.revenueThisMonth

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2.5">
              <Landmark className="h-7 w-7 text-amber-500" /> Financial ERP & P&L Statement
            </h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              General ledger, GST compliance summaries, revenue breakdown, expense tracking, and profit margins.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            {(['today', 'week', 'month'] as const).map((period) => (
              <Button
                key={period}
                size="sm"
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                onClick={() => setSelectedPeriod(period)}
                className={`text-xs font-bold rounded-xl px-3 py-1 uppercase ${
                  selectedPeriod === period
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        {/* Financial KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-500/30 bg-zinc-900/90 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Gross Revenue ({selectedPeriod})</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{formatINR(currentRev)}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-1 font-semibold">
                  <ArrowUpRight className="h-3 w-3" /> +14.2% vs prior period
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-zinc-900/90 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Net Profit</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{formatINR(financials.totalProfit)}</p>
                <p className="text-[10px] text-amber-300 font-semibold mt-1">
                  Margin: <span className="font-extrabold">{financials.netProfitMargin}%</span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-zinc-900/90 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">GST Collected (5%)</p>
                <p className="text-2xl font-black text-blue-400 mt-1">{formatINR(financials.gstCollected)}</p>
                <p className="text-[10px] text-blue-300 font-semibold mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Filing Ready
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Receipt className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/30 bg-zinc-900/90 rounded-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase">Food & Labour Cost %</p>
                <p className="text-2xl font-black text-purple-400 mt-1">
                  {(financials.foodCost + financials.labourCost).toFixed(1)}%
                </p>
                <p className="text-[10px] text-purple-300 font-semibold mt-1">
                  Food: {financials.foodCost}% | Labour: {financials.labourCost}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Percent className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* P&L Statement & Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-zinc-800 bg-zinc-900/80 rounded-3xl">
            <CardHeader className="p-5 border-b border-zinc-800">
              <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-400" /> Profit & Loss Statement (MTD)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Itemized operating income, cost of goods sold (COGS), overheads, and EBITDA.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 font-semibold">
                <span className="text-zinc-300">Gross Dining & Delivery Sales</span>
                <span className="text-emerald-400 font-bold">{formatINR(financials.revenueThisMonth)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 text-zinc-400 pl-4">
                <span>(-) Cost of Ingredients & Food (COGS - 24.5%)</span>
                <span className="text-red-400 font-mono">-{formatINR(financials.revenueThisMonth * 0.245)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 font-semibold">
                <span className="text-zinc-200">Gross Margin</span>
                <span className="text-emerald-300 font-bold">{formatINR(financials.revenueThisMonth * 0.755)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 text-zinc-400 pl-4">
                <span>(-) Kitchen & Wait Staff Payroll (18.2%)</span>
                <span className="text-red-400 font-mono">-{formatINR(financials.revenueThisMonth * 0.182)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800/60 text-zinc-400 pl-4">
                <span>(-) Operating Overheads (Rent, Utilities, Software)</span>
                <span className="text-red-400 font-mono">-{formatINR(financials.operatingExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-3 rounded-xl bg-amber-500/10 px-4 border border-amber-500/30 text-sm font-black text-amber-400">
                <span>Net Operating EBITDA Profit</span>
                <span>{formatINR(financials.totalProfit)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card className="border-zinc-800 bg-zinc-900/80 rounded-3xl">
            <CardHeader className="p-5 border-b border-zinc-800">
              <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-400" /> Quarterly Profit Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {MONTHLY_COMPARISON.map((m) => (
                <div key={m.month} className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold text-zinc-200">
                    <span>{m.month}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                      {m.margin} Margin
                    </Badge>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[11px] font-mono">
                    <span>Rev: {formatINR(m.revenue)}</span>
                    <span className="text-emerald-400 font-bold">Profit: {formatINR(m.profit)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Vendor Invoices & Accounts Payable */}
        <Card className="border-zinc-800 bg-zinc-900/80 rounded-3xl">
          <CardHeader className="p-5 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" /> Recent Vendor Invoices & Accounts Payable
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Audit supplier payouts, food procurement bills, and pending operational invoices.
              </CardDescription>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
              Accounts Payable
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Invoice ID</th>
                  <th className="p-4">Vendor Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {INVOICES.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-800/40">
                    <td className="p-4 font-mono font-bold text-amber-400">{inv.id}</td>
                    <td className="p-4 font-semibold text-zinc-100">{inv.vendor}</td>
                    <td className="p-4 text-zinc-400">{inv.category}</td>
                    <td className="p-4 font-bold font-mono text-zinc-100">{formatINR(inv.amount)}</td>
                    <td className="p-4 text-zinc-400">{inv.date}</td>
                    <td className="p-4 text-zinc-400">{inv.method}</td>
                    <td className="p-4">
                      <Badge
                        className={`text-[10px] font-bold ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
