import { useRef } from 'react'
import type { FormEvent } from 'react'
import { dateLabel } from '../../lib/api'
import type { Endpoint } from '../../types'
import { EmptyState, PageHeading, PanelHeading, fieldClass, panelClass } from '../../shared/ui'

type EndpointsPageProps = {
  endpoints: Endpoint[]
  busy: boolean
  editingId: string
  endpointName: string
  endpointUrl: string
  selectedEndpoint: string
  payload: string
  onNameChange: (value: string) => void
  onUrlChange: (value: string) => void
  onSelectedEndpointChange: (value: string) => void
  onPayloadChange: (value: string) => void
  onSave: (event: FormEvent<HTMLFormElement>) => void
  onDelete: (endpoint: Endpoint) => void
  onEdit: (endpoint: Endpoint) => void
  onSendEvent: (event: FormEvent<HTMLFormElement>) => void
  onAdd: () => void
  onCancelEdit: () => void
}

export function EndpointsPage({
  endpoints,
  busy,
  editingId,
  endpointName,
  endpointUrl,
  selectedEndpoint,
  payload,
  onNameChange,
  onUrlChange,
  onSelectedEndpointChange,
  onPayloadChange,
  onSave,
  onDelete,
  onEdit,
  onSendEvent,
  onAdd,
  onCancelEdit,
}: EndpointsPageProps) {
  const nameInput = useRef<HTMLInputElement>(null)

  const startCreate = () => {
    onAdd()
    nameInput.current?.focus()
  }

  return (
    <>
      <PageHeading
        eyebrow="Configuration"
        title="Endpoints"
        description="Manage the destinations that receive your webhook events."
        action={<button className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/15 transition hover:bg-violet-700 max-sm:px-3" onClick={startCreate}>＋ Add endpoint</button>}
      />

      <section className={`${panelClass} mb-4 p-5`}>
        <PanelHeading
          title={editingId ? 'Edit endpoint' : 'Create an endpoint'}
          description="Use a public HTTPS URL for the best security."
          action={editingId ? <button className="text-xs font-semibold text-violet-700" onClick={onCancelEdit}>Cancel edit</button> : undefined}
        />
        <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1.5fr] md:gap-5" onSubmit={onSave}>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Endpoint name
            <input ref={nameInput} className={fieldClass} id="endpoint-name" required maxLength={100} value={endpointName} onChange={(event) => onNameChange(event.target.value)} placeholder="e.g. Production API" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">Destination URL
            <input className={fieldClass} type="url" required maxLength={2048} value={endpointUrl} onChange={(event) => onUrlChange(event.target.value)} placeholder="https://api.example.com/webhooks" />
            <small className="text-xs font-normal leading-5 text-slate-500">HTTP and HTTPS are supported. Private, local, and non-standard ports are blocked for test deliveries.</small>
          </label>
          <div className="flex justify-end md:col-span-2">
            <button className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Create endpoint'}</button>
          </div>
        </form>
      </section>

      <section className={`${panelClass} mb-4 overflow-hidden`}>
        <div className="px-5 py-4">
          <PanelHeading
            title={<>Configured endpoints <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">{endpoints.length}</span></>}
            description="Endpoints belong to your account only."
          />
        </div>
        {endpoints.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr><th className="px-5 py-3">Endpoint</th><th className="px-5 py-3">Destination</th><th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-500">
                {endpoints.map((endpoint) => (
                  <tr className="hover:bg-slate-50/70" key={endpoint.id}>
                    <td className="whitespace-nowrap px-5 py-3"><span className="mr-2 inline-grid size-7 place-items-center rounded-lg bg-violet-50 text-violet-700">⌘</span><strong className="font-semibold text-slate-700">{endpoint.name}</strong></td>
                    <td className="max-w-xs truncate px-5 py-3">{endpoint.targetUrl}</td>
                    <td className="whitespace-nowrap px-5 py-3">{dateLabel(endpoint.createdAt)}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <button className="px-2 py-1 font-semibold text-violet-700 hover:text-violet-900" onClick={() => onEdit(endpoint)}>Edit</button>
                      <button className="px-2 py-1 font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50" disabled={busy} onClick={() => onDelete(endpoint)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="◎" title="Your endpoints will appear here" description="Create an endpoint to start sending test events." />
        )}
      </section>

      {endpoints.length > 0 && (
        <section className={`${panelClass} p-5`}>
          <PanelHeading title="Send a test event" description="POST a JSON event to a configured endpoint." action={<span className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">POST · JSON</span>} />
          <form className="mt-5 grid gap-4" onSubmit={onSendEvent}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Destination
              <select className={fieldClass} required value={selectedEndpoint} onChange={(event) => onSelectedEndpointChange(event.target.value)}>
                {endpoints.map((endpoint) => <option value={endpoint.id} key={endpoint.id}>{endpoint.name} — {endpoint.targetUrl}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Event payload
              <textarea className={`${fieldClass} min-h-52 resize-y bg-slate-50 font-mono text-xs leading-5`} spellCheck={false} rows={9} value={payload} onChange={(event) => onPayloadChange(event.target.value)} />
            </label>
            <div className="flex items-center justify-between gap-4 max-sm:items-start max-sm:flex-col">
              <span className="text-xs text-slate-400">Maximum request body: 1 MB</span>
              <button className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !selectedEndpoint}>{busy ? 'Sending…' : '↗ Send test event'}</button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
