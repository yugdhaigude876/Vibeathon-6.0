'use client'

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Calendar,
  BarChart2,
  TrendingUp,
  Award,
  Users,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ManagerReportsPage() {
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['manager'])
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleExportCSV = (reportType: string) => {
    setDownloading(reportType)

    setTimeout(() => {
      let csvContent = 'data:text/csv;charset=utf-8,'
      if (reportType === 'daily') {
        csvContent += 'Date,Orders,Revenue,AOV,Completion Rate\n2026-07-26,24,14850.00,618.75,98%\n2026-07-25,21,12420.00,591.42,95%'
      } else if (reportType === 'inventory') {
        csvContent += 'Item,Category,Stock Level,Reorder Point,Status\nTomato Queso De Crema,Soup,25,10,In Stock\nMushrooms,Signature Tapas,4,10,Low Stock'
      } else {
        csvContent += 'Metric,Value\nTotal Customers,142\nRepeat Customer Rate,48%\nAverage Spend per Table,₹1250'
      }

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `PLATR_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Report Downloaded! 📥',
        description: `Exported ${reportType.toUpperCase()} report as CSV.`,
      })
      setDownloading(null)
    }, 800)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Executive Reports...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <FileText className="h-7 w-7 text-amber-500" />
            Executive Reports & Data Analytics
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Download daily sales summaries, inventory consumption, and customer spend metrics.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Report 1: Daily Revenue & Order Summary */}
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Daily Revenue & Order Summary
              </CardTitle>
              <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs">
                Financials
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Aggregated daily sales totals, completion rates, and average order value.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Today's Total Gross Sales</span>
                <span className="font-bold text-amber-400">{formatINR(14850)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Total Orders Processed</span>
                <span className="font-bold text-zinc-100">24 Orders</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Average Order Value (AOV)</span>
                <span className="font-bold text-zinc-100">{formatINR(618.75)}</span>
              </div>
            </div>

            <Button
              onClick={() => handleExportCSV('daily')}
              disabled={downloading === 'daily'}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {downloading === 'daily' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Daily Summary CSV
            </Button>
          </CardContent>
        </Card>

        {/* Report 2: Inventory Consumption */}
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-sky-400" />
                Inventory & Stock Usage Report
              </CardTitle>
              <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30 text-xs">
                Supply Chain
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Ingredient velocity, stock burn rate, and reorder cost projections.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Items Below Reorder Threshold</span>
                <span className="font-bold text-red-400">3 Items</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Estimated Reorder Cost</span>
                <span className="font-bold text-zinc-100">{formatINR(4200)}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Most Consumed Category</span>
                <span className="font-bold text-zinc-100">Signature Tapas</span>
              </div>
            </div>

            <Button
              onClick={() => handleExportCSV('inventory')}
              disabled={downloading === 'inventory'}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {downloading === 'inventory' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Inventory Report CSV
            </Button>
          </CardContent>
        </Card>

        {/* Report 3: Customer Analytics */}
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Customer Demographics & Repeat Spend
              </CardTitle>
              <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                Analytics
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Repeat guest percentage, peak booking hours, and table duration averages.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-300">
                <span>Repeat Guest Rate</span>
                <span className="font-bold text-emerald-400">48%</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Peak Dining Hour</span>
                <span className="font-bold text-zinc-100">8:00 PM – 9:30 PM</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Average Table Turnover</span>
                <span className="font-bold text-zinc-100">38 Mins</span>
              </div>
            </div>

            <Button
              onClick={() => handleExportCSV('customer')}
              disabled={downloading === 'customer'}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2"
            >
              {downloading === 'customer' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Customer Analytics CSV
            </Button>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/80 shadow-md md:col-span-2">
          <CardHeader className="pb-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-400" />
                Enterprise System Audit Trail & Activity Log
              </CardTitle>
              <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs font-mono">
                Security & Governance
              </Badge>
            </div>
            <CardDescription className="text-xs text-zinc-400">
              Timestamped log of price edits, role changes, inventory adjustments, and managerial overrides.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="font-mono text-zinc-400">2026-07-27 14:30:12</span>
                <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">Price Update</Badge>
              </div>
              <p className="text-zinc-200"><span className="font-bold text-amber-400">admin.manager@platr.com</span> updated Truffle Risotto price from ₹720 to ₹750</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="font-mono text-zinc-400">2026-07-27 13:15:45</span>
                <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Stock Alert</Badge>
              </div>
              <p className="text-zinc-200"><span className="font-bold text-amber-400">kitchen.staff@platr.com</span> marked 5kg Fresh Basil as consumed</p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="font-mono text-zinc-400">2026-07-27 11:00:00</span>
                <Badge className="bg-purple-500/20 text-purple-300 text-[10px]">RBAC Role Change</Badge>
              </div>
              <p className="text-zinc-200"><span className="font-bold text-amber-400">admin.manager@platr.com</span> updated user permissions for Priya Verma</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
