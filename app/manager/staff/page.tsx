'use client'

import React, { useState } from 'react'
import {
  Users,
  Clock,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Loader2,
  Plus,
  MessageSquare,
} from 'lucide-react'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface StaffMember {
  id: string
  name: string
  role: 'head_chef' | 'sous_chef' | 'waitstaff' | 'manager'
  status: 'on_duty' | 'on_break' | 'off_duty'
  hours_today: number
  last_active: string
}

const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Chef Suresh Kumar', role: 'head_chef', status: 'on_duty', hours_today: 6.5, last_active: '2 mins ago' },
  { id: 's2', name: 'Priya Sharma', role: 'sous_chef', status: 'on_duty', hours_today: 5.0, last_active: 'Just now' },
  { id: 's3', name: 'Rohan Verma', role: 'waitstaff', status: 'on_break', hours_today: 4.2, last_active: '15 mins ago' },
  { id: 's4', name: 'Neha Gupta', role: 'waitstaff', status: 'on_duty', hours_today: 6.0, last_active: '5 mins ago' },
  { id: 's5', name: 'Vikram Singh', role: 'manager', status: 'on_duty', hours_today: 7.5, last_active: 'Just now' },
]

export default function ManagerStaffPage() {
  const { toast } = useToast()
  const { authorized, loading: authLoading } = useRoleGuard(['manager'])
  const [staffList] = useState<StaffMember[]>(INITIAL_STAFF)

  const activeCount = staffList.filter((s) => s.status === 'on_duty').length
  const breakCount = staffList.filter((s) => s.status === 'on_break').length

  const handleMessageTeam = () => {
    toast({
      title: 'Broadcast Announcement Sent 📢',
      description: 'Notification sent to all currently active staff devices.',
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-3" />
        <span className="text-lg font-medium">Loading Team Roster...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-50 flex items-center gap-2">
            <Users className="h-7 w-7 text-amber-500" />
            Staffing & Team Roster Coordination
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Monitor active shifts, clock-in status, and send team broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleMessageTeam} size="sm" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs">
            <MessageSquare className="h-4 w-4 mr-1" />
            Broadcast to Active Team
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">On Duty Right Now</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{activeCount} Staff</p>
            </div>
            <UserCheck className="h-8 w-8 text-emerald-500/40" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">On Break</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{breakCount} Staff</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500/40" />
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Total Shift Hours Today</p>
              <p className="text-2xl font-black text-sky-400 mt-1">
                {staffList.reduce((sum, s) => sum + s.hours_today, 0).toFixed(1)} hrs
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-sky-500/40" />
          </CardContent>
        </Card>
      </div>

      {/* Staff Roster Table */}
      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="p-4 border-b border-zinc-800">
          <CardTitle className="text-base font-bold text-zinc-100">Team Shift Directory</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-950/60">
              <TableRow className="border-zinc-800">
                <TableHead className="text-xs font-bold text-zinc-300">Staff Member</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Role</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Shift Status</TableHead>
                <TableHead className="text-xs font-bold text-zinc-300">Hours Today</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-300">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-800/60">
              {staffList.map((member) => (
                <TableRow key={member.id} className="border-zinc-800/60">
                  <TableCell className="font-bold text-xs text-zinc-100">{member.name}</TableCell>
                  <TableCell className="text-xs text-zinc-300 capitalize">
                    {member.role.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize text-[10px] ${
                        member.status === 'on_duty'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : member.status === 'on_break'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {member.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-zinc-300">{member.hours_today} hrs</TableCell>
                  <TableCell className="text-right text-xs text-zinc-400">{member.last_active}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
