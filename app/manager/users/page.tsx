'use client'

import React, { useState } from 'react'

import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Users, ShieldCheck, UserPlus, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function UserManagementPage() {
  const { toast } = useToast()
  const { users, toggleUserStatus, customers, toggleBlacklistCustomer } = useManagerStore()
  
  const [userList, setUserList] = useState(users)
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'chef' | 'waiter' | 'cashier' | 'delivery' | 'manager'>('chef')
  const [branch, setBranch] = useState('Luft Main Dining (Bandra)')
  const [submitting, setSubmitting] = useState(false)

  const handleProvisionUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    setSubmitting(true)
    setTimeout(() => {
      const newUser = {
        id: `u-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        branch,
        status: 'active' as const,
        createdAt: new Date().toISOString().split('T')[0],
      }

      setUserList((prev) => [newUser, ...prev])

      toast({
        title: 'Staff Provisioned 🎉',
        description: `New staff account for ${name} (${role.toUpperCase()}) has been created.`,
      })

      setName('')
      setEmail('')
      setShowProvisionModal(false)
      setSubmitting(false)
    }, 400)
  }

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
          <Button
            size="sm"
            onClick={() => setShowProvisionModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl"
          >
            <UserPlus className="mr-1.5 h-4 w-4" /> Provision New Staff User
          </Button>
        </div>

        <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-zinc-800">
            <CardTitle className="text-base font-bold text-zinc-100 flex items-center justify-between">
              <span>System User Roster ({userList.length} Registered Accounts)</span>
              <Badge className="bg-purple-500/20 text-purple-300 text-xs">Role-Based Security</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-800/80">
              {userList.map((user) => (
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

        {/* Customer Intelligence CRM Section */}
        <Card className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden shadow-lg mt-8">
          <CardHeader className="p-6 pb-4 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-zinc-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" /> Customer Intelligence & VIP Loyalty CRM
              </CardTitle>
              <p className="text-xs text-zinc-400 mt-1">
                Lifetime Value (LTV), visit frequency, dining preferences, membership tiers, & churn risk alerts.
              </p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              PLATR Loyalty Engine
            </Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Tier</th>
                  <th className="p-4">Lifetime Value</th>
                  <th className="p-4">Avg Order Value</th>
                  <th className="p-4">Fav Category</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/40">
                    <td className="p-4 font-bold text-zinc-100">{c.name}</td>
                    <td className="p-4 text-zinc-400 font-mono">{c.email} <br/>{c.phone}</td>
                    <td className="p-4">
                      <Badge
                        className={`text-[10px] font-black uppercase ${
                          c.tier === 'VIP'
                            ? 'bg-amber-500 text-zinc-950'
                            : c.tier === 'Platinum'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {c.tier}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-emerald-400 font-mono">₹{c.lifetimeValue.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono text-zinc-200">₹{c.avgOrderValue.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-amber-300 font-semibold">{c.favouriteCategory || 'General'}</td>
                    <td className="p-4 font-bold text-purple-400 font-mono">{c.rewardPoints} pts</td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleBlacklistCustomer(c.id)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-xl border ${
                          c.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-red-500/20 hover:text-red-300'
                            : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-emerald-500/20 hover:text-emerald-300'
                        }`}
                      >
                        {c.status === 'active' ? 'Active' : 'Blacklisted'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showProvisionModal} onOpenChange={setShowProvisionModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <UserPlus className="h-5 w-5 text-amber-400" /> Provision New Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Create credentials & grant role-based permissions for new restaurant personnel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProvisionUser} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Staff Full Name</Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Work Email Address</Label>
              <Input
                type="email"
                placeholder="rahul.sharma@platr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Role & Permission Tier</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="chef">Chef (Kitchen KDS & Stock)</option>
                <option value="waiter">Waiter (Floor & Tables)</option>
                <option value="cashier">Cashier (POS & Receipts)</option>
                <option value="delivery">Delivery (Rider Dispatch)</option>
                <option value="manager">Manager (Full ERP Access)</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowProvisionModal(false)} className="border-zinc-800 text-xs text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 'Confirm Provisioning'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
