import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  children: ReactNode
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-8 shadow-xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
          Acme
        </p>
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  )
}
