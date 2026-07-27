'use client'

import React, { useState } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { useStaffStore } from '@/lib/staffStore'
import { WaiterTable } from '@/lib/staffTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Utensils,
  Receipt,
  BellRing,
  CheckCircle2,
  Plus,
  ArrowRightLeft,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react'

export default function WaiterPage() {
  const { tables, requests, updateTableStatus, addCustomerRequest, clearTableRequests } = useStaffStore()
  const [selectedTable, setSelectedTable] = useState<WaiterTable | null>(tables[0])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Floor & Table Management</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Manage seating, table transfers, bill requests, and guest calls in real time.
            </p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
            Live Floor View
          </Badge>
        </div>

        {/* Table Grid View */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {tables.map((tbl: WaiterTable) => (
            <button
              key={tbl.id}
              onClick={() => setSelectedTable(tbl)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selectedTable?.id === tbl.id
                  ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-zinc-100">{tbl.tableNumber}</span>
                <Badge
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 ${
                    tbl.status === 'occupied'
                      ? 'bg-amber-500/20 text-amber-400'
                      : tbl.status === 'billing'
                      ? 'bg-purple-500/20 text-purple-400'
                      : tbl.status === 'reserved'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {tbl.status}
                </Badge>
              </div>

              <div className="mt-3 space-y-1 text-xs">
                <p className="text-zinc-400 flex items-center gap-1 font-semibold">
                  <Users className="h-3 w-3" /> {tbl.occupancy}/{tbl.capacity} Seats
                </p>
                <p className="text-amber-400 font-mono font-bold">₹{tbl.currentBillAmount}</p>
              </div>

              {tbl.customerRequests.length > 0 && (
                <div className="mt-2 text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded-md border border-red-500/30 flex items-center gap-1">
                  <BellRing className="h-3 w-3" /> {tbl.customerRequests.length} Requests
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Table Workspace */}
        {selectedTable && (
          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-amber-400 flex items-center gap-3">
                  Table Workspace — {selectedTable.tableNumber}
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Assigned Waiter: <span className="text-zinc-200">{selectedTable.assignedWaiter || 'Unassigned'}</span> | Occupancy: {selectedTable.occupancy}/{selectedTable.capacity}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateTableStatus(selectedTable.id, 'billing')}
                  className="bg-purple-600 hover:bg-purple-700 text-zinc-100 text-xs font-bold rounded-xl"
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Request Bill
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTableStatus(selectedTable.id, 'available')}
                  className="border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Clear & Close Table
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions & Requests */}
              <div className="space-y-4">
                <h3 className="text-sm font-extrabold uppercase text-zinc-300 tracking-wider">Quick Table Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Water', 'Extra Sauce', 'Extra Plates', 'Call Waiter', 'Birthday Celebration'].map((reqType) => (
                    <Button
                      key={reqType}
                      variant="outline"
                      size="sm"
                      onClick={() => addCustomerRequest({ tableNumber: selectedTable.tableNumber, type: reqType as any, priority: 'normal' })}
                      className="justify-start border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400 text-xs font-semibold rounded-xl h-10"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> {reqType}
                    </Button>
                  ))}
                </div>

                {selectedTable.notes && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 italic">
                    Note: {selectedTable.notes}
                  </div>
                )}
              </div>

              {/* Active Customer Requests for this table */}
              <div className="space-y-4 border-l border-zinc-800 pl-0 md:pl-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase text-zinc-300 tracking-wider">Active Guest Requests</h3>
                  {selectedTable.customerRequests.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearTableRequests(selectedTable.id)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-100"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {selectedTable.customerRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4">No pending guest requests for this table.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTable.customerRequests.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs">
                        <span className="font-bold text-amber-400">{req}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">In Progress</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
