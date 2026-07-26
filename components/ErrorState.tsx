'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  showRetryButton?: boolean
  retryLabel?: string
  supportingText?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  showRetryButton = true,
  retryLabel = 'Try Again',
  supportingText,
}: ErrorStateProps) {
  return (
    <Card className="border border-red-500/30 bg-red-950/20">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-base font-semibold text-red-300">{title}</h3>
          <p className="text-sm text-red-200/80">{message}</p>
          {supportingText && <p className="mt-2 text-sm text-red-200/70">{supportingText}</p>}
          {showRetryButton && onRetry && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="min-h-10 border-red-500/40 text-red-300 hover:bg-red-950/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {retryLabel}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
