export type Endpoint = {
  id: string
  name: string
  targetUrl: string
  createdAt: string
  updatedAt: string
}

export type Delivery = {
  id: string
  webhookId: string | null
  endpointName: string
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
  responseStatus: number | null
  durationMs: number
  createdAt: string
  attemptCount: number
}

export type DeliveryAttempt = {
  id: string
  attemptNumber: number
  status: 'STARTED' | 'SUCCEEDED' | 'FAILED'
  responseStatus: number | null
  responseBody: string | null
  error: string | null
  durationMs: number
  createdAt: string
}

export type DeliveryDetail = Delivery & {
  targetUrl: string
  payload: Record<string, unknown>
  responseBody: string | null
  error: string | null
  attempts: DeliveryAttempt[]
}

export type User = { id: string; email: string }
export type AuthResponse = { token: string; user: User }
export type View = 'overview' | 'endpoints' | 'events'
export type AuthMode = 'login' | 'register'
