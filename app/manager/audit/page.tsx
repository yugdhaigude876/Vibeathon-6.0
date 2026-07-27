'use client'

import React from 'react'
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  UserCheck,
  Tag,
  Clock,
  Layers,
} from 'lucide-react'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AuditTimelinePage() {
  const { auditLogs } = useManagerStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide flex items-center gap-2.5">
              <History className="h-7 w-7 text-amber-500" /> Enterprise Audit Trail & Security Timeline
            </h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Immutable activity log: Price changes, role assignments, inventory updates, and security events.
            </p>
          </div>

          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> SOC2 Compliance Logging Active
          </Badge>
        </div>

        {/* Audit Log Timeline */}
        <Card className="border-zinc-800 bg-zinc-900/80 rounded-3xl">
          <CardHeader className="p-5 border-b border-zinc-800">
            <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-400" /> System Events Chronology ({auditLogs.length} Events Logged)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Tracked across POS Terminal, Manager Portal, Kitchen KDS, and Inventory ERP.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative border-l border-zinc-800 ml-4 space-y-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6">
                  {/* Timeline Node */}
                  <span
                    className={`absolute -left-2.5 top-1.5 h-5 w-5 rounded-full border-2 border-zinc-950 ${
                      log.severity === 'critical'
                        ? 'bg-red-500'
                        : log.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold">
                          {log.module}
                        </Badge>
                        <span className="text-xs font-bold text-amber-400 uppercase">{log.action}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {log.timestamp}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-zinc-200">{log.details}</p>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-900 pt-2 mt-2">
                      <span className="flex items-center gap-1 font-mono">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> User: <strong className="text-zinc-300">{log.user}</strong> ({log.role})
                      </span>
                      <Badge
                        className={`text-[9px] uppercase font-extrabold ${
                          log.severity === 'critical'
                            ? 'bg-red-500/20 text-red-400'
                            : log.severity === 'warning'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {log.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
