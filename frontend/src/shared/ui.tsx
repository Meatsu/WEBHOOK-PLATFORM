import type { ReactNode } from 'react'

export const panelClass =
  'rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]'

export const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10'

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: ReactNode
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5 max-sm:items-start">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-600">{eyebrow}</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function PanelHeading({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-slate-800">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
      <span className="mb-3 grid size-11 place-items-center rounded-xl bg-violet-50 text-lg text-violet-600">{icon}</span>
      <strong className="text-sm font-semibold text-slate-700">{title}</strong>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const appearance = {
    SUCCEEDED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  }[status] || 'bg-slate-100 text-slate-600 ring-slate-500/10'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${appearance}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {status.toLowerCase()}
    </span>
  )
}
