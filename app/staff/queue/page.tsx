'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  Armchair,
  Loader2,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface QueueCustomer {
  id: string
  name: string
  party_size: number
  added_at: string
  status: 'waiting' | 'seated' | 'cancelled'
}

interface TableItem {
  id: number
  name: string
  capacity: number
  status: 'empty' | 'seated' | 'reserved'
}

const DEFAULT_TABLES: TableItem[] = [
  { id: 1, name: 'Table 1', capacity: 2, status: 'empty' },
  { id: 2, name: 'Table 2', capacity: 2, status: 'seated' },
  { id: 3, name: 'Table 3', capacity: 4, status: 'empty' },
  { id: 4, name: 'Table 4', capacity: 4, status: 'empty' },
  { id: 5, name: 'Table 5', capacity: 6, status: 'seated' },
  { id: 6, name: 'Table 6', capacity: 6, status: 'empty' },
  { id: 7, name: 'Table 7', capacity: 8, status: 'empty' },
  { id: 8, name: 'Table 8', capacity: 2, status: 'empty' },
]

const INITIAL_QUEUE: QueueCustomer[] = [
  { id: 'q1', name: 'Vikram Mehta', party_size: 2, added_at: new Date(Date.now() - 12 * 60000).toISOString(), status: 'waiting' },
  { id: 'q2', name: 'Ananya Roy', party_size: 4, added_at: new Date(Date.now() - 6 * 60000).toISOString(), status: 'waiting' },
  { id: 'q3', name: 'Siddharth & Team', party_size: 6, added_at: new Date(Date.now() - 2 * 60000).toISOString(), status: 'waiting' },
]

export default function StaffQueuePage() {
  const supabase = createClient()
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['staff', 'manager'])

  const [queue, setQueue] = useState<QueueCustomer[]>(INITIAL_QUEUE)
  const [tables, setTables] = useState<TableItem[]>(DEFAULT_TABLES)

  // Form State
  const [customerName, setCustomerName] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [adding, setAdding] = useState(false)

  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<QueueCustomer | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)

  // Calculate est wait time (5 mins per waiting party)
  const waitingList = useMemo(() => queue.filter((q) => q.status === 'waiting'), [queue])
  const occupiedCount = useMemo(() => tables.filter((t) => t.status === 'seated').length, [tables])
  const estWaitMins = waitingList.length * 5

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      toast({
        title: 'Missing Name',
        description: 'Please enter customer name.',
        variant: 'destructive',
      })
      return
    }

    setAdding(true)
    const newEntry: QueueCustomer = {
      id: `q_${Date.now()}`,
      name: customerName.trim(),
      party_size: Number(partySize),
      added_at: new Date().toISOString(),
      status: 'waiting',
    }

    setQueue((prev) => [...prev, newEntry])
    setCustomerName('')
    setPartySize('2')
    setAdding(false)

    toast({
      title: 'Added to Walk-in Queue! 📋',
      description: `${newEntry.name} (party of ${newEntry.party_size}) added to wait list.`,
    })
  }

  const handleConfirmSeating = () => {
    if (!selectedCustomer || !selectedTableId) return

    const tableObj = tables.find((t) => t.id === selectedTableId)

    // Update queue item
    setQueue((prev) =>
      prev.map((q) => (q.id === selectedCustomer.id ? { ...q, status: 'seated' } : q))
    )

    // Update table status
    setTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, status: 'seated' } : t))
    )

    toast({
      title: 'Customer Seated! 🪑',
      description: `${selectedCustomer.name} seated at ${tableObj?.name || `Table ${selectedTableId}`}.`,
    })

    setSelectedCustomer(null)
    setSelectedTableId(null)
  }

  const handleCancelQueue = (id: string, name: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id))
    toast({
      title: 'Removed from Queue',
      description: `${name} removed from wait list.`,
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Host Stand Queue...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <Armchair className="h-7 w-7 text-amber-500" />
            Walk-in Host Stand & Queue
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage live walk-in seating, table assignments, and estimated wait times.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30 px-3 py-1 text-xs">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            Est. Wait: <span className="font-bold ml-1">{estWaitMins} mins</span>
          </Badge>
          <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30 px-3 py-1 text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5 text-sky-400" />
            Tables Seated: <span className="font-bold ml-1">{occupiedCount} of {tables.length}</span>
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* SECTION 1: ADD TO QUEUE FORM (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/70 shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="h-4 w-4 text-amber-400" />
                Add Walk-in Party
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Register arriving guests into the live queue.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              <form onSubmit={handleAddToQueue} className="space-y-4">
                <div>
                  <Label className="text-xs text-zinc-300">Customer / Party Name</Label>
                  <Input
                    placeholder="e.g. Anish Gupta"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-sm text-zinc-100 focus-visible:ring-amber-500 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Party Size (Number of Guests)</Label>
                  <select
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={adding}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-5 text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Queue
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Table Summary Card */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-200">Floor Table Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-2 text-center text-xs">
              {tables.map((t) => (
                <div
                  key={t.id}
                  className={`p-2 rounded-lg border ${
                    t.status === 'seated'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  <div className="font-bold">{t.name}</div>
                  <div className="text-[10px] opacity-80">{t.capacity}p • {t.status}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: QUEUE LIST (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 px-4 py-3 rounded-2xl">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-400" />
              Live Waiting Queue ({waitingList.length})
            </h2>
            <span className="text-xs text-zinc-400">Position 1 is next in line</span>
          </div>

          {waitingList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
              <UserCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-zinc-200">No Customers Waiting</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Walk-in queue is empty. Add new arriving parties using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {waitingList.map((customer, index) => {
                const waitMins = Math.max(0, Math.floor((Date.now() - new Date(customer.added_at).getTime()) / 60000))
                const partyBadgeColor =
                  customer.party_size <= 2
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : customer.party_size <= 4
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-red-500/20 text-red-300 border-red-500/40'

                return (
                  <Card
                    key={customer.id}
                    className="border border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-all"
                  >
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 font-black text-amber-400 text-sm">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                            {customer.name}
                            <Badge className={`text-xs ${partyBadgeColor}`}>
                              Party of {customer.party_size}
                            </Badge>
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-zinc-500" />
                            Waiting {waitMins}m • Est. seating in ~{Math.max(2, (index + 1) * 4)}m
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setSelectedCustomer(customer)}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Armchair className="h-4 w-4" />
                          Seat Now
                        </Button>

                        <Button
                          onClick={() => handleCancelQueue(customer.id, customer.name)}
                          variant="outline"
                          size="sm"
                          className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 text-xs"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table Selection Modal */}
      <Dialog open={Boolean(selectedCustomer)} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <Armchair className="h-5 w-5 text-amber-400" />
              Select Table for {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Party of {selectedCustomer?.party_size} guests. Choose an available table to assign.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-3">
            {tables.map((t) => {
              const isSelected = selectedTableId === t.id
              const isSeated = t.status === 'seated'
              const fitsParty = t.capacity >= (selectedCustomer?.party_size || 1)

              return (
                <div
                  key={t.id}
                  onClick={() => !isSeated && setSelectedTableId(t.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSeated
                      ? 'border-zinc-800 bg-zinc-950/50 text-zinc-500 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                      : fitsParty
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-500'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-[10px] border-zinc-700">
                      {t.capacity} Seats
                    </Badge>
                  </div>
                  <p className="text-[11px] mt-1 capitalize font-medium">
                    {isSeated ? 'Occupied' : fitsParty ? 'Fits Party 🟢' : 'Small Table'}
                  </p>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedCustomer(null)}
              className="border-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSeating}
              disabled={!selectedTableId}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
            >
              Confirm Seating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
