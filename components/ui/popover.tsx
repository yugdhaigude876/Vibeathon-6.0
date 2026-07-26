'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PopoverProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
}

export function Popover({ children, trigger, className }: PopoverProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-auto rounded-2xl border border-amber-500/30 bg-zinc-950 p-4 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
