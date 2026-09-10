import type { ReactNode } from 'react'

interface SidebarSectionProps {
  title: string
  children: ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-violet-200/70">
        {title}
      </h2>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  )
}
