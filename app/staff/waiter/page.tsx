'use client'

import React, { useState, useEffect } from 'react'
import { StaffHeader } from '@/components/staff/StaffHeader'
import { useStaffStore, resetAllSystemData } from '@/lib/staffStore'
import { WaiterTable } from '@/lib/staffTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
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
  RotateCcw,
} from 'lucide-react'

export default function WaiterPage() {
  const { toast } = useToast()
  const { tables, requests, updateTableStatus, addCustomerRequest, addRequestToTable, removeCustomerRequestFromTable, clearTableRequests, assignWaiterToTable } = useStaffStore()
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || 't1')

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0]

  // Real-time listener for Customer Service Bell Requests
  useEffect(() => {
    const handleIncomingRequest = (req: any) => {
      if (!req) return
      const targetTable = tables.find(
        (t) => t.tableNumber.toLowerCase() === (req.tableNumber || req.table_number || '').toLowerCase()
      ) || tables[3] // Default T-04

      if (targetTable) {
        addRequestToTable(targetTable.id, req.request)
        addCustomerRequest({
          tableNumber: targetTable.tableNumber,
          type: 'Call Waiter',
          note: req.request,
          priority: 'urgent',
        })
        toast({
          title: `NEW SERVICE BELL ALERT! 🔔 (${targetTable.tableNumber})`,
          description: `Guest requested: ${req.request}`,
        })
      }

    }

    // 1. BroadcastChannel Listener
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('luft_waiter_requests_channel')
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_WAITER_REQUEST') {
          handleIncomingRequest(event.data.request)
        }
      }
      return () => bc.close()
    }
  }, [tables])

  const handleResetSystem = () => {
    try {
      localStorage.removeItem('platr_user_orders')
      localStorage.removeItem('platr_user_reservations')
      localStorage.removeItem('platr_customer_requests')
      localStorage.removeItem('luft_last_new_order')
      localStorage.removeItem('luft_last_status_update')
    } catch (e) {
      console.warn(e)
    }
    resetAllSystemData()
    toast({
      title: 'System Orders Reset 🔄',
      description: 'All system orders, testing stats, and tables have been reset to zero.',
    })
  }


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <StaffHeader />

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide flex items-center gap-3">
              Floor & Table Management
            </h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Manage seating, table transfers, bill requests, and guest calls in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetSystem}
              className="border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 text-xs font-bold rounded-xl h-9"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-amber-400" />
              Reset System Testing Stats
            </Button>

            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 font-bold">
              Live Floor View
            </Badge>
          </div>
        </div>

        {/* Table Grid View */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {tables.map((tbl: WaiterTable) => (
            <button
              key={tbl.id}
              onClick={() => setSelectedTableId(tbl.id)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selectedTable?.id === tbl.id
                  ? 'border-amber-500 bg-amber-950/20 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-zinc-100">{tbl.tableNumber}</span>
                <Badge
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 ${
                    tbl.status === 'occupied'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : tbl.status === 'billing'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                      : tbl.status === 'reserved'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
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
                <div className="mt-2 text-[10px] font-bold text-red-400 bg-red-950/40 px-2 py-1 rounded-md border border-red-500/40 flex items-center gap-1">
                  <BellRing className="h-3 w-3 animate-pulse text-red-400" /> {tbl.customerRequests.length} Requests
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Table Workspace */}
        {selectedTable && (
          <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-black text-amber-400 flex items-center gap-3">
                  Table Workspace — {selectedTable.tableNumber}
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-1 font-semibold">
                  Assigned Waiter: <span className="text-zinc-200">{selectedTable.assignedWaiter || 'Rahul Verma'}</span> | Status:{' '}
                  <span className="uppercase text-amber-300 font-bold">{selectedTable.status}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    updateTableStatus(selectedTable.id, 'billing')
                    toast({ title: `Table ${selectedTable.tableNumber} Bill Requested`, description: 'Status updated to billing.' })
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-zinc-100 text-xs font-bold rounded-xl"
                >
                  <Receipt className="mr-1.5 h-3.5 w-3.5" /> Request Bill
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    updateTableStatus(selectedTable.id, 'available')
                    toast({ title: `Table ${selectedTable.tableNumber} Cleared`, description: 'Table is now available for new guests.' })
                  }}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-bold rounded-xl"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5 text-zinc-400" /> Clear & Close Table
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
                      onClick={() => {
                        addCustomerRequest({ tableNumber: selectedTable.tableNumber, type: reqType as any, priority: 'normal' })
                        addRequestToTable(selectedTable.id, reqType)
                        toast({ title: `⚡ Request Added (${selectedTable.tableNumber})`, description: `Added: ${reqType}` })
                      }}
                      className="justify-start border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400 text-xs font-semibold rounded-xl h-10 transition-colors"
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
                      onClick={() => {
                        clearTableRequests(selectedTable.id)
                        toast({ title: `Requests Cleared`, description: `Cleared active requests for ${selectedTable.tableNumber}.` })
                      }}
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            removeCustomerRequestFromTable(selectedTable.id, req)
                            toast({ title: `Request Resolved`, description: `Marked "${req}" as complete.` })
                          }}
                          className="h-7 px-2.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg font-bold flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Mark Done
                        </Button>
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

