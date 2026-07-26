'use client'

import { AlertCircle, Search, ShoppingBag, Calendar, Utensils } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  variant?: 'search' | 'orders' | 'reservations' | 'menu' | 'default'
}

const emptyStateConfig = {
  search: {
    icon: <Search className="h-6 w-6 text-amber-400" />,
  },
  orders: {
    icon: <ShoppingBag className="h-6 w-6 text-amber-400" />,
  },
  reservations: {
    icon: <Calendar className="h-6 w-6 text-amber-400" />,
  },
  menu: {
    icon: <Utensils className="h-6 w-6 text-amber-400" />,
  },
  default: {
    icon: <AlertCircle className="h-6 w-6 text-amber-400" />,
  },
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const config = emptyStateConfig[variant]

  return (
    <Card className="border border-dashed border-amber-500/25 bg-zinc-900/60">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          {icon || config.icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-zinc-100">{title}</h3>
        <p className="mb-6 max-w-xs text-sm text-zinc-400">{description}</p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="min-h-11 bg-amber-500 px-4 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
