import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { WorkspaceLayout } from './app/WorkspaceLayout'
import { AuthPage } from './features/auth/AuthPage'
import { OverviewPage } from './features/dashboard/OverviewPage'
import { EndpointsPage } from './features/endpoints/EndpointsPage'
import { EventHistoryPage } from './features/events/EventHistoryPage'
import { request } from './lib/api'
import type { AuthResponse, Delivery, DeliveryDetail, Endpoint, User, View } from './types'

const initialPayload = `{
  "event": "order.created",
  "data": {
    "orderId": "ord_123",
    "amount": 49.99
  }
}`

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('relay-token') || '')
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('relay-user')
    return saved ? JSON.parse(saved) as User : null
  })
  const [view, setView] = useState<View>('overview')
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [events, setEvents] = useState<Delivery[]>([])
  const [selectedEvent, setSelectedEvent] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [endpointName, setEndpointName] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [editingId, setEditingId] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [payload, setPayload] = useState(initialPayload)

  const loadData = useCallback(async (activeToken: string) => {
    setLoading(true)
    setError('')
    try {
      const [endpointData, eventData] = await Promise.all([
        request<Endpoint[]>('/api/webhooks', activeToken),
        request<Delivery[]>('/api/events', activeToken),
      ])
      setEndpoints(endpointData)
      setEvents(eventData)
      setSelectedEndpoint((current) => current || endpointData[0]?.id || '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) void loadData(token)
  }, [token, loadData])

  const successfulCount = useMemo(
    () => events.filter((event) => event.status === 'SUCCEEDED').length,
    [events],
  )

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await request<AuthResponse>(`/api/auth/${authMode}`, undefined, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      sessionStorage.setItem('relay-token', result.token)
      sessionStorage.setItem('relay-user', JSON.stringify(result.user))
      setToken(result.token)
      setUser(result.user)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    try {
      await request('/api/auth/logout', token, { method: 'POST' })
    } catch {
      // Clear the local session even if the access token has expired.
    }
    sessionStorage.removeItem('relay-token')
    sessionStorage.removeItem('relay-user')
    setToken('')
    setUser(null)
    setEndpoints([])
    setEvents([])
    setSelectedEvent(null)
  }

  const saveEndpoint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const wasEditing = Boolean(editingId)
      await request<Endpoint>(editingId ? `/api/webhooks/${editingId}` : '/api/webhooks', token, {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({ name: endpointName, targetUrl: endpointUrl }),
      })
      setEndpointName('')
      setEndpointUrl('')
      setEditingId('')
      setNotice(wasEditing ? 'Endpoint updated.' : 'Endpoint created.')
      await loadData(token)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save endpoint.')
    } finally {
      setBusy(false)
    }
  }

  const editEndpoint = (endpoint: Endpoint) => {
    setEditingId(endpoint.id)
    setEndpointName(endpoint.name)
    setEndpointUrl(endpoint.targetUrl)
    setView('endpoints')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deleteEndpoint = async (endpoint: Endpoint) => {
    if (!window.confirm(`Delete "${endpoint.name}"? Existing delivery history will be retained.`)) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/webhooks/${endpoint.id}`, token, { method: 'DELETE' })
      setNotice('Endpoint deleted.')
      await loadData(token)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete endpoint.')
    } finally {
      setBusy(false)
    }
  }

  const showEvent = async (id: string) => {
    try {
      const detail = await request<DeliveryDetail>(`/api/events/${id}`, token)
      setSelectedEvent(detail)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load event details.')
    }
  }

  const sendEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    let parsedPayload: unknown
    try {
      parsedPayload = JSON.parse(payload)
      if (!parsedPayload || Array.isArray(parsedPayload) || typeof parsedPayload !== 'object') {
        throw new Error('Enter a JSON object to send.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enter valid JSON.')
      setBusy(false)
      return
    }
    try {
      const delivery = await request<Delivery>(
        `/api/webhooks/${selectedEndpoint}/test-events`,
        token,
        { method: 'POST', body: JSON.stringify({ payload: parsedPayload }) },
      )
      setNotice(delivery.status === 'SUCCEEDED'
        ? `Delivered successfully in ${delivery.durationMs} ms.`
        : 'The delivery failed. Open the event to inspect the response.')
      await loadData(token)
      setView('events')
      await showEvent(delivery.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send test event.')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        busy={busy}
        error={error}
        onSubmit={(event) => void authenticate(event)}
        clearError={() => setError('')}
      />
    )
  }

  return (
    <WorkspaceLayout
      view={view}
      setView={setView}
      user={user}
      endpointCount={endpoints.length}
      eventCount={events.length}
      error={error}
      notice={notice}
      loading={loading}
      onDismissError={() => setError('')}
      onDismissNotice={() => setNotice('')}
      onRefresh={() => void loadData(token)}
      onLogout={() => void logout()}
    >
      {view === 'overview' && (
        <OverviewPage
          user={user}
          endpoints={endpoints}
          events={events}
          successfulCount={successfulCount}
          onView={setView}
          onEditEndpoint={editEndpoint}
          onShowEvent={(id) => void showEvent(id)}
          onNewEndpoint={() => {
            setEditingId('')
            setView('endpoints')
          }}
        />
      )}
      {view === 'endpoints' && (
        <EndpointsPage
          endpoints={endpoints}
          busy={busy}
          editingId={editingId}
          endpointName={endpointName}
          endpointUrl={endpointUrl}
          selectedEndpoint={selectedEndpoint}
          payload={payload}
          onNameChange={setEndpointName}
          onUrlChange={setEndpointUrl}
          onSelectedEndpointChange={setSelectedEndpoint}
          onPayloadChange={setPayload}
          onSave={(event) => void saveEndpoint(event)}
          onDelete={(endpoint) => void deleteEndpoint(endpoint)}
          onEdit={editEndpoint}
          onSendEvent={(event) => void sendEvent(event)}
          onAdd={() => {
            setEditingId('')
            setEndpointName('')
            setEndpointUrl('')
          }}
          onCancelEdit={() => {
            setEditingId('')
            setEndpointName('')
            setEndpointUrl('')
          }}
        />
      )}
      {view === 'events' && (
        <EventHistoryPage
          events={events}
          selectedEvent={selectedEvent}
          onView={setView}
          onRefresh={() => void loadData(token)}
          onShowEvent={(id) => void showEvent(id)}
          onCloseDetails={() => setSelectedEvent(null)}
        />
      )}
    </WorkspaceLayout>
  )
}

export default App
