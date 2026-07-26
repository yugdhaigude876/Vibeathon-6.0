'use client'

import { useMemo, useState } from 'react'
import { Bell, CheckCircle2, Clock, UserPlus, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface QueueParty {
  id: number
  customer_name: string
  phone_number: string
  party_size: number
  estimated_wait: number
  status: 'waiting' | 'notified' | 'seated' | 'cancelled'
  created_at: string
}

const initialQueue: QueueParty[] = [
  {
    id: 1,
    customer_name: 'Ava Patel',
    phone_number: '555-0142',
    party_size: 2,
    estimated_wait: 10,
    status: 'waiting',
    created_at: '2026-07-25T18:10:00.000Z',
  },
  {
    id: 2,
    customer_name: 'Miguel Chen',
    phone_number: '555-0143',
    party_size: 4,
    estimated_wait: 20,
    status: 'notified',
    created_at: '2026-07-25T18:20:00.000Z',
  },
]

export default function QueuePage() {
  const { toast } = useToast()
  const [queue, setQueue] = useState<QueueParty[]>(initialQueue)
  const [form, setForm] = useState({
    customer_name: '',
    phone_number: '',
    party_size: '2',
  })

  const activeQueue = useMemo(() => queue.filter((party) => party.status !== 'seated' && party.status !== 'cancelled'), [queue])

  const estimatedWait = useMemo(() => {
    const waitingCount = activeQueue.filter((party) => party.status === 'waiting').length
    return Math.max(10, waitingCount * 10)
  }, [activeQueue])

  const addParty = () => {
    if (!form.customer_name.trim() || !form.phone_number.trim()) return

    const party: QueueParty = {
      id: Date.now(),
      customer_name: form.customer_name.trim(),
      phone_number: form.phone_number.trim(),
      party_size: Number(form.party_size) || 2,
      estimated_wait: estimatedWait,
      status: 'waiting',
      created_at: new Date().toISOString(),
    }

    setQueue((current) => [party, ...current])
    setForm({ customer_name: '', phone_number: '', party_size: '2' })
    toast({ title: 'Party added to waitlist', description: `${party.customer_name} is now waiting.` })
  }

  const updatePartyStatus = (id: number, status: QueueParty['status']) => {
    setQueue((current) => current.map((party) => (party.id === id ? { ...party, status } : party)))
    const party = queue.find((entry) => entry.id === id)
    if (party) {
      toast({ title: 'Queue updated', description: `${party.customer_name} marked as ${status}.` })
    }
  }

  const removeParty = (id: number) => {
    const party = queue.find((entry) => entry.id === id)
    setQueue((current) => current.filter((entry) => entry.id !== id))
    if (party) {
      toast({ title: 'Party removed', description: `${party.customer_name} was removed from the queue.` })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Walk-In Queue</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Host stand management</h1>
              <p className="mt-2 text-sm text-zinc-400">Add walk-in parties, notify guests, and seat them quickly.</p>
            </div>

            <Card className="border border-zinc-800 bg-zinc-950/80">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm text-zinc-400">Estimated wait</p>
                  <p className="text-lg font-semibold text-zinc-100">{estimatedWait} mins</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <UserPlus className="h-5 w-5 text-amber-400" />
              Add Walk-In Party
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Customer name"
              value={form.customer_name}
              onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))}
              className="border-zinc-800 bg-zinc-950 text-zinc-100"
            />
            <Input
              placeholder="Phone number"
              value={form.phone_number}
              onChange={(event) => setForm((current) => ({ ...current, phone_number: event.target.value }))}
              className="border-zinc-800 bg-zinc-950 text-zinc-100"
            />
            <Input
              type="number"
              min="1"
              placeholder="Party size"
              value={form.party_size}
              onChange={(event) => setForm((current) => ({ ...current, party_size: event.target.value }))}
              className="border-zinc-800 bg-zinc-950 text-zinc-100"
            />
            <div className="md:col-span-3">
              <Button onClick={addParty} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
                <UserPlus className="mr-2 h-4 w-4" />
                Add to Queue
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="text-zinc-100">Active Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Wait</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeQueue.map((party) => (
                  <TableRow key={party.id}>
                    <TableCell>
                      <div className="font-medium text-zinc-100">{party.customer_name}</div>
                      <div className="text-sm text-zinc-400">{party.phone_number}</div>
                    </TableCell>
                    <TableCell className="text-zinc-100">{party.party_size} guests</TableCell>
                    <TableCell className="text-zinc-100">{party.estimated_wait} mins</TableCell>
                    <TableCell>
                      <Badge className={party.status === 'waiting' ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}>
                        {party.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {party.status === 'waiting' ? (
                          <Button size="sm" variant="outline" onClick={() => updatePartyStatus(party.id, 'notified')} className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                            <Bell className="mr-2 h-4 w-4" />
                            Notify
                          </Button>
                        ) : null}
                        {party.status === 'notified' ? (
                          <Button size="sm" onClick={() => updatePartyStatus(party.id, 'seated')} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Seat
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => removeParty(party.id)} className="border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                          <Clock className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
