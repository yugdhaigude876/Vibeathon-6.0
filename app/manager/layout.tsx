'use client'

import React from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <ManagerHeader />
      <main>{children}</main>
    </div>
  )
}
