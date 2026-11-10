export async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(path, { ...init, headers })
  const result = await response.json() as {
    status?: boolean
    message?: string
    data?: T
    [key: string]: unknown
  }
  if (!response.ok || result.status === false) {
    throw new Error(result.message || `Request failed (${response.status}).`)
  }
  return (result.data ?? result) as T
}

export const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value))

export const initials = (email: string) => email.slice(0, 1).toUpperCase()
