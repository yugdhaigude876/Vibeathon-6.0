'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  validating?: boolean
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      validating,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-zinc-200">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              {icon}
            </div>
          )}
          <Input
            ref={ref}
            className={cn(
              'transition-colors',
              icon && 'pl-10',
              error && 'border-red-500/50 bg-red-950/10 focus-visible:border-red-500',
              validating && 'border-amber-500/50 bg-amber-950/10',
              !error && !validating && 'border-amber-500/20',
              className
            )}
            {...props}
          />
          {validating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {helperText && !error && (
          <p className="text-xs text-zinc-400">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
