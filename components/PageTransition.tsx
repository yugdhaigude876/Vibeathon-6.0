'use client'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="w-full transition-opacity duration-200">{children}</div>
}
