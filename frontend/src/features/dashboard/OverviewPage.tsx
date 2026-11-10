import { dateLabel } from '../../lib/api'
import type { Delivery, Endpoint, User, View } from '../../types'
import { EmptyState, PageHeading, PanelHeading, panelClass } from '../../shared/ui'

type OverviewPageProps = {
  user: User | null
  endpoints: Endpoint[]
  events: Delivery[]
  successfulCount: number
  onView: (view: View) => void
  onEditEndpoint: (endpoint: Endpoint) => void
  onShowEvent: (id: string) => void
  onNewEndpoint: () => void
}

const stats = [
  { title: 'Active endpoints', icon: '◎', color: 'bg-violet-50 text-violet-700' },
  { title: 'Events sent', icon: '↗', color: 'bg-blue-50 text-blue-700' },
  { title: 'Successful deliveries', icon: '✓', color: 'bg-emerald-50 text-emerald-700' },
  { title: 'Latest response', icon: '◷', color: 'bg-orange-50 text-orange-700' },
]

export function OverviewPage({
  user,
  endpoints,
  events,
  successfulCount,
  onView,
  onEditEndpoint,
  onShowEvent,
  onNewEndpoint,
}: OverviewPageProps) {
  const values = [
    endpoints.length.toString().padStart(2, '0'),
    events.length.toString().padStart(2, '0'),
    events.length ? `${Math.round(successfulCount / events.length * 100)}%` : '—',
    events[0] ? `${events[0].durationMs} ms` : '—',
  ]
  const descriptions = [
    'Configured in your workspace',
    'Last 100 delivery attempts',
    `${successfulCount} successful deliveries`,
    events[0] ? 'Most recent delivery' : 'Send a test event to begin',
  ]

  return (
    <>
      <PageHeading
        eyebrow="Your workspace"
        title={<>Good to see you{user?.email ? `, ${user.email.split('@')[0]}` : ''} <span className="text-violet-500">✳</span></>}
        description="Here’s what’s happening with your webhook infrastructure."
        action={<button className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/15 transition hover:bg-violet-700 max-sm:px-3" onClick={onNewEndpoint}>＋ New endpoint</button>}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article className={`${panelClass} relative min-h-36 overflow-hidden p-4`} key={stat.title}>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              {stat.title}<span className={`grid size-8 place-items-center rounded-lg text-sm ${stat.color}`}>{stat.icon}</span>
            </div>
            <strong className="mt-4 block font-display text-3xl font-bold tracking-tight text-slate-900">{values[index]}</strong>
            <small className="mt-1 block text-[11px] text-slate-400">{descriptions[index]}</small>
            <span className={`pointer-events-none absolute -bottom-5 right-4 text-6xl opacity-[0.07] ${stat.color.split(' ')[1]}`}>⌁</span>
          </article>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <section className={`${panelClass} min-h-[18rem] p-5`}>
          <PanelHeading
            title="Recent deliveries"
            description="Your latest webhook activity"
            action={<button className="text-xs font-semibold text-violet-700 hover:text-violet-900" onClick={() => onView('events')}>View all →</button>}
          />
          {events.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {events.slice(0, 5).map((event) => (
                <button className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50/80" key={event.id} onClick={() => { onView('events'); onShowEvent(event.id) }}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs ${event.status === 'SUCCEEDED' ? 'bg-emerald-50 text-emerald-700' : event.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{event.status === 'SUCCEEDED' ? '✓' : event.status === 'FAILED' ? '!' : '◷'}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-xs font-semibold text-slate-700">{event.endpointName}</strong>
                    <small className="mt-1 block truncate text-[11px] text-slate-400">{event.responseStatus ? `HTTP ${event.responseStatus}` : event.status === 'FAILED' ? 'Delivery failed' : 'Waiting for response'} · {dateLabel(event.createdAt)}</small>
                  </span>
                  <span className="whitespace-nowrap text-[11px] text-slate-500">{event.durationMs} ms</span>
                  <span className="text-slate-300">›</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState icon="↗" title="No deliveries yet" description="Send a JSON test event to see delivery activity here." action={<button className="text-xs font-semibold text-violet-700" onClick={() => onView('endpoints')}>Set up an endpoint →</button>} />
          )}
        </section>

        <section className={`${panelClass} min-h-[18rem] p-5`}>
          <PanelHeading
            title="Your endpoints"
            description="Webhook destinations in this workspace"
            action={<button className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => onView('endpoints')} aria-label="Manage endpoints">···</button>}
          />
          {endpoints.length ? (
            <>
              <div className="my-4 divide-y divide-slate-100">
                {endpoints.slice(0, 4).map((endpoint) => (
                  <button className="flex w-full items-center gap-3 py-3 text-left" key={endpoint.id} onClick={() => onEditEndpoint(endpoint)}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700">⌘</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-slate-700">{endpoint.name}</strong><small className="mt-1 block truncate text-[11px] text-slate-400">{endpoint.targetUrl}</small></span>
                    <i className="size-1.5 rounded-full bg-emerald-400" />
                  </button>
                ))}
              </div>
              <button className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-violet-700 hover:border-violet-300 hover:bg-violet-50/50" onClick={onNewEndpoint}>＋ Add endpoint</button>
            </>
          ) : (
            <EmptyState icon="◎" title="No endpoints configured" description="Create your first endpoint to get started." action={<button className="text-xs font-semibold text-violet-700" onClick={onNewEndpoint}>Create an endpoint →</button>} />
          )}
        </section>
      </div>

      <section className="mt-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-white p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-lg text-violet-700">◇</span>
        <div><strong className="text-xs font-semibold text-slate-800">Built with security in mind</strong><p className="mt-1 text-[11px] leading-5 text-slate-500">Test deliveries are rate limited, scoped to your account, and blocked from private or local network addresses.</p></div>
        <span className="ml-auto rounded-md bg-violet-100 px-2 py-1 text-[9px] font-bold tracking-wider text-violet-700 max-sm:hidden">PROTECTED</span>
      </section>
    </>
  )
}
