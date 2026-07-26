'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CalendarProps {
  selectedDate?: Date
  onSelectDate?: (date: Date) => void
  minDate?: Date
  className?: string
}

export function Calendar({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selectedDate || new Date()
  )

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startingDay = firstDayOfMonth.getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const isSameDay = (d1?: Date, d2?: Date) => {
    if (!d1 || !d2) return false
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const isBeforeMinDate = (d: Date) => {
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return d < min
  }

  return (
    <div className={cn('p-3 select-none w-64', className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-amber-300">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {dayNames.map((d) => (
          <span key={d} className="text-[11px] font-semibold text-zinc-500">
            {d}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1
          const dateObj = new Date(year, month, dayNum)
          const isSelected = isSameDay(selectedDate, dateObj)
          const isDisabled = isBeforeMinDate(dateObj)

          return (
            <button
              key={dayNum}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate?.(dateObj)}
              className={cn(
                'h-8 w-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all',
                isSelected
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : isDisabled
                  ? 'text-zinc-700 cursor-not-allowed opacity-40'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-amber-400'
              )}
            >
              {dayNum}
            </button>
          )
        })}
      </div>
    </div>
  )
}
