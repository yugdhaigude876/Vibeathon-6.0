'use client'

import { useEffect, useMemo, useState } from 'react'
import { Armchair, Circle, Grid, UserCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TableRecord {
  id: string
  number: number
  capacity: number
  status: 'empty' | 'seated' | 'paying'
  restaurant_id?: string | null
}

const statusStyles: Record<TableRecord['status'], string> = {
  empty: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  seated: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  paying: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
}

const statusLabels: Record<TableRecord['status'], string> = {
  empty: 'Empty',
  seated: 'Seated',
  paying: 'Paying',
}

export default function TablesPage() {
  const supabase = createClient()
  const { authorized, loading: authLoading } = useRoleGuard(['manager', 'staff'])
  const [tables, setTables] = useState<TableRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<TableRecord | null>(null)

  useEffect(() => {
    if (!authorized) return

    const loadTables = async () => {
      const { data } = await supabase.from('tables').select('*').order('number', { ascending: true })
      if (data) {
        setTables(data as TableRecord[])
      }
      setLoading(false)
    }

    void loadTables()
  }, [authorized, supabase])

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        Loading table map...
      </div>
    )
  }

  const stats = useMemo(() => {
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
    const currentlySeated = tables.filter((table) => table.status === 'seated').length
    const availableTables = tables.filter((table) => table.status === 'empty').length

    return { totalCapacity, currentlySeated, availableTables }
  }, [tables])

  const updateTableStatus = async (tableId: string, status: TableRecord['status']) => {
    const { error } = await supabase.from('tables').update({ status }).eq('id', tableId)

    if (error) {
      console.error('Failed to update table status:', error)
      return
    }

    setTables((current) => current.map((table) => (table.id === tableId ? { ...table, status } : table)))
    setSelectedTable((current) => (current && current.id === tableId ? { ...current, status } : current))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-200">
        Loading table map...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">Table Management</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Interactive floor layout</h1>
              <p className="mt-2 text-sm text-zinc-400">Click any table to update its occupancy status in real time.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border border-zinc-800 bg-zinc-950/80">
                <CardContent className="p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Capacity</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">{stats.totalCapacity}</p>
                </CardContent>
              </Card>
              <Card className="border border-zinc-800 bg-zinc-950/80">
                <CardContent className="p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Seated</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">{stats.currentlySeated}</p>
                </CardContent>
              </Card>
              <Card className="border border-zinc-800 bg-zinc-950/80">
                <CardContent className="p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Available</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-100">{stats.availableTables}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer border transition-all hover:-translate-y-0.5 ${table.status === 'empty' ? 'border-emerald-500/20 hover:border-emerald-500/40' : table.status === 'seated' ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-sky-500/20 hover:border-sky-500/40'}`}
              onClick={() => setSelectedTable(table)}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-lg text-zinc-100">Table {table.number}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-400">{table.capacity} Seats</p>
                </div>
                <Badge className={statusStyles[table.status]}>{statusLabels[table.status]}</Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Armchair className="h-4 w-4" />
                  Floor position
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  {table.status === 'empty' ? <Circle className="h-4 w-4 text-emerald-400" /> : <UserCheck className="h-4 w-4 text-amber-400" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(selectedTable)} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Table Status</DialogTitle>
            <DialogDescription>Select a new availability state for this table.</DialogDescription>
          </DialogHeader>

          {selectedTable ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm text-zinc-400">Selected Table</p>
                <p className="mt-1 text-xl font-semibold text-zinc-100">Table {selectedTable.number}</p>
                <p className="mt-1 text-sm text-zinc-400">Capacity: {selectedTable.capacity} seats</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full border-zinc-700 bg-zinc-950 text-zinc-100 hover:bg-zinc-800">
                    <Grid className="mr-2 h-4 w-4" />
                    Set status: {statusLabels[selectedTable.status]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => void updateTableStatus(selectedTable.id, 'empty')}>
                    <Circle className="mr-2 h-4 w-4 text-emerald-400" />
                    Empty
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void updateTableStatus(selectedTable.id, 'seated')}>
                    <UserCheck className="mr-2 h-4 w-4 text-amber-400" />
                    Seated
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void updateTableStatus(selectedTable.id, 'paying')}>
                    <Circle className="mr-2 h-4 w-4 text-sky-400" />
                    Paying
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
