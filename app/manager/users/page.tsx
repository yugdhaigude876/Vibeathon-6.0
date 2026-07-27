'use client'

import React from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ShieldCheck, UserPlus, Lock, CheckCircle2, XCircle } from 'lucide-react'

export default function UserManagementPage() {
  const { users, toggleUserStatus, customers, toggleBlacklistCustomer } = useManagerStore()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">User & Staff Access Control (RBAC)</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Manage permissions, activate/deactivate staff accounts, and view user audit logs.
            </p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl">
            <UserPlus className="mr-1.5 h-4 w-4" /> Provision New Staff User
          </Button>
        </div>

        <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-zinc-800">
            <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
              <span>System User Roster ({users.length} Registered Accounts)</span>
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">Role-Based Security</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/80">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-zinc-900/40 transition-colors gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800 font-bold text-amber-400 text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-100">{user.name}</span>
                        <Badge className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">{user.email} • {user.branch}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                        user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {user.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleUserStatus(user.id)}
                      className="border-zinc-800 text-xs font-bold rounded-xl"
                    >
                      {user.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                    </Button>
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
