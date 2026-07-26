import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function BreadcrumbNav({ items, className = '' }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-zinc-400 ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-amber-300">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-zinc-200' : ''}>{item.label}</span>
              )}
              {!isLast && <ChevronRight className="h-4 w-4 text-zinc-600" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
