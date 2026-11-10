import type { ReactNode } from 'react'
import { initials } from '../lib/api'
import type { User, View } from '../types'

type WorkspaceLayoutProps = {
  view: View
  setView: (view: View) => void
  user: User | null
  endpointCount: number
  eventCount: number
  error: string
  notice: string
  loading: boolean
  onDismissError: () => void
  onDismissNotice: () => void
  onRefresh: () => void
  onLogout: () => void
  children: ReactNode
}

const navigation: { view: View; label: string; icon: string }[] = [
  { view: 'overview', label: 'Overview', icon: '▦' },
  { view: 'endpoints', label: 'Endpoints', icon: '◎' },
  { view: 'events', label: 'Event history', icon: '↗' },
]

export function WorkspaceLayout({
  view,
  setView,
  user,
  endpointCount,
  eventCount,
  error,
  notice,
  loading,
  onDismissError,
  onDismissNotice,
  onRefresh,
  onLogout,
  children,
}: WorkspaceLayoutProps) {
  const pageTitle = navigation.find((item) => item.view === view)?.label ?? 'Overview'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 max-lg:w-[4.5rem] max-lg:items-center max-lg:px-2">
        <button
          className="mb-9 flex items-center gap-2.5 self-start pl-2 font-display text-xl font-extrabold tracking-tight text-slate-900 max-lg:mb-8 max-lg:pl-0"
          onClick={() => setView('overview')}
          aria-label="Relay overview"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-xl font-extrabold text-white shadow-lg shadow-violet-500/20">r</span>
          <span className="max-lg:hidden">relay</span>
        </button>

        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 max-lg:hidden">Workspace</p>
        <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2.5 max-lg:hidden">
          <span className="grid size-9 place-items-center rounded-lg bg-violet-50 font-semibold text-violet-700">R</span>
          <span className="min-w-0 text-xs font-semibold text-slate-700">Personal workspace<small className="mt-1 block font-normal text-slate-400">Free plan</small></span>
          <span className="ml-auto text-slate-400">⌄</span>
        </div>

        <p className="mb-2 mt-8 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 max-lg:hidden">Platform</p>
        <nav className="grid w-full gap-1.5" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = view === item.view
            const count = item.view === 'endpoints' ? endpointCount : item.view === 'events' ? eventCount : null
            return (
              <button
                key={item.view}
                className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition max-lg:justify-center max-lg:px-0 ${active ? 'bg-violet-50 font-semibold text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                onClick={() => setView(item.view)}
                aria-current={active ? 'page' : undefined}
                title={item.label}
              >
                <span className="w-5 text-center text-base">{item.icon}</span>
                <span className="max-lg:hidden">{item.label}</span>
                {count !== null && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 max-lg:hidden">{count}</span>}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto w-full rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-3 max-lg:hidden">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-100 text-violet-700">◇</span>
          <strong className="mt-2 block text-xs text-slate-800">Security first</strong>
          <p className="mt-1 text-[11px] leading-4 text-slate-500">Outbound requests are restricted to public endpoints.</p>
          <button className="mt-2 text-[11px] font-semibold text-violet-700" onClick={() => setView('overview')}>Learn about security ↗</button>
        </div>

        <div className="mt-4 flex w-full items-center gap-2.5 border-t border-slate-100 pt-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials(user?.email || 'R')}</span>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 max-lg:hidden">{user?.email || 'Relay user'}<small className="mt-1 block font-normal text-slate-400">Personal account</small></span>
          <button className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 max-lg:hidden" onClick={onLogout} aria-label="Sign out" title="Sign out">↗</button>
        </div>
      </aside>

      <div className="ml-64 flex min-h-screen flex-col max-lg:ml-[4.5rem]">
        <header className="sticky top-0 z-[5] flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-7 backdrop-blur max-sm:px-4">
          <div className="text-xs text-slate-500">Workspace <span className="px-2 text-slate-300">/</span><strong className="font-semibold text-slate-800">{pageTitle}</strong></div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-slate-500 max-sm:hidden"><i className="size-2 rounded-full bg-emerald-400 ring-4 ring-emerald-100" />API operational</span>
            <button className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onRefresh} aria-label="Refresh data" title="Refresh">↻</button>
            <span className="grid size-8 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 sm:hidden">{initials(user?.email || 'R')}</span>
            <button className="hidden size-8 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 sm:grid" onClick={onLogout} aria-label="Sign out" title="Sign out">{initials(user?.email || 'R')}</button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-7 py-8 max-sm:px-4 max-sm:py-6">
          {error && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}<button onClick={onDismissError} aria-label="Dismiss error" className="text-lg leading-none">×</button></div>}
          {notice && <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{notice}<button onClick={onDismissNotice} aria-label="Dismiss message" className="text-lg leading-none">×</button></div>}
          {loading && <div className="mb-4 flex items-center gap-2 text-xs text-slate-500" role="status"><span className="size-2 animate-pulse rounded-full bg-violet-500" />Refreshing your workspace…</div>}
          {children}
        </main>
        <footer className="flex justify-between gap-4 border-t border-slate-200 bg-white px-7 py-4 text-[11px] text-slate-400 max-sm:px-4">
          <span>Relay <b className="px-1 text-slate-300">·</b> Webhook operations, made clear.</span>
          <span className="max-sm:hidden">Encrypted sessions <b className="px-1 text-slate-300">·</b> Request limits enabled</span>
        </footer>
      </div>
    </div>
  )
}
