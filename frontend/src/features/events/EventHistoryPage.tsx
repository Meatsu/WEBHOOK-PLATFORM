import { dateLabel } from '../../lib/api'
import type { Delivery, DeliveryDetail, View } from '../../types'
import { EmptyState, PageHeading, PanelHeading, StatusBadge, panelClass } from '../../shared/ui'

type EventHistoryPageProps = {
  events: Delivery[]
  selectedEvent: DeliveryDetail | null
  onView: (view: View) => void
  onRefresh: () => void
  onShowEvent: (id: string) => void
  onCloseDetails: () => void
}

export function EventHistoryPage({
  events,
  selectedEvent,
  onView,
  onRefresh,
  onShowEvent,
  onCloseDetails,
}: EventHistoryPageProps) {
  return (
    <>
      <PageHeading
        eyebrow="Observability"
        title="Event history"
        description="Inspect recent delivery attempts and response details."
        action={<button className="shrink-0 rounded-lg bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 max-sm:px-3" onClick={() => onView('endpoints')}>＋ Send test event</button>}
      />

      <section className={`${panelClass} mb-4 overflow-hidden`}>
        <div className="px-5 py-4">
          <PanelHeading
            title={<>Recent activity <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">{events.length}</span></>}
            description="Showing up to the latest 100 deliveries."
            action={<button className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onRefresh} title="Refresh events" aria-label="Refresh events">↻</button>}
          />
        </div>
        {events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[690px] border-collapse text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr><th className="px-5 py-3">Status</th><th className="px-5 py-3">Endpoint</th><th className="px-5 py-3">HTTP</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3">Time</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-500">
                {events.map((event) => (
                  <tr className="cursor-pointer hover:bg-violet-50/40" key={event.id} onClick={() => onShowEvent(event.id)}>
                    <td className="px-5 py-3"><StatusBadge status={event.status} /></td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{event.endpointName}</td>
                    <td className="px-5 py-3">{event.responseStatus || '—'}</td>
                    <td className="px-5 py-3">{event.durationMs} ms</td>
                    <td className="px-5 py-3 whitespace-nowrap">{dateLabel(event.createdAt)}</td>
                    <td className="px-5 py-3 text-right"><button className="font-semibold text-violet-700 hover:text-violet-900" onClick={(click) => { click.stopPropagation(); onShowEvent(event.id) }}>Details →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="↗" title="No event history yet" description="Send a test event from your endpoint page to see it here." action={<button className="text-xs font-semibold text-violet-700" onClick={() => onView('endpoints')}>Go to endpoints →</button>} />
        )}
      </section>

      {selectedEvent && (
        <section className={`${panelClass} p-5`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">Delivery details</p>
              <h2 className="mt-2 flex flex-wrap items-center gap-2 font-display text-base font-bold text-slate-800">{selectedEvent.endpointName}<StatusBadge status={selectedEvent.status} /></h2>
              <p className="mt-1 text-xs text-slate-500">{dateLabel(selectedEvent.createdAt)} · {selectedEvent.durationMs} ms · {selectedEvent.responseStatus ? `HTTP ${selectedEvent.responseStatus}` : 'No response'}</p>
            </div>
            <button className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onCloseDetails} aria-label="Close event details">×</button>
          </div>

          <div className="mt-4 grid gap-1 border-y border-slate-100 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</span>
            <code className="break-all text-xs text-slate-600">{selectedEvent.targetUrl}</code>
          </div>
          {selectedEvent.error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{selectedEvent.error}</div>}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CodeBlock title="Request payload" value={JSON.stringify(selectedEvent.payload, null, 2)} />
            <CodeBlock title="Endpoint response" value={selectedEvent.responseBody || 'No response body was received.'} />
          </div>
        </section>
      )}
    </>
  )
}

function CodeBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}<button className="normal-case tracking-normal text-violet-700 hover:text-violet-900" onClick={() => void navigator.clipboard.writeText(value)}>Copy</button>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">{value}</pre>
    </div>
  )
}
