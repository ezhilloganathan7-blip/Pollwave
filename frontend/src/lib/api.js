const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function saveSession(data) {
  localStorage.setItem('pw_token', data.token)
  localStorage.setItem('pw_user', JSON.stringify(data.user))
  localStorage.setItem('pw_session_expires', String(Date.now() + SESSION_TTL_MS))
}

export function clearSession() {
  localStorage.removeItem('pw_token')
  localStorage.removeItem('pw_user')
  localStorage.removeItem('pw_session_expires')
}

export function hasValidSession() {
  const token = localStorage.getItem('pw_token')
  if (!token) return false

  let expiresAt = Number(localStorage.getItem('pw_session_expires'))
  if (!expiresAt) {
    expiresAt = Date.now() + SESSION_TTL_MS
    localStorage.setItem('pw_session_expires', String(expiresAt))
  }

  if (Date.now() >= expiresAt) {
    clearSession()
    return false
  }
  return true
}

function authHeaders() {
  const token = localStorage.getItem('pw_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {}),
    },
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) {
    if (res.status === 401) clearSession()
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  myPolls: () => request('/api/polls'),
  createPoll: (body) => request('/api/polls', { method: 'POST', body: JSON.stringify(body) }),
  getPoll: (slug) => request(`/api/polls/${slug}`),
  vote: (slug, body) => request(`/api/polls/${slug}/vote`, { method: 'POST', body: JSON.stringify(body) }),
  closePoll: (slug) => request(`/api/polls/${slug}/close`, { method: 'PATCH' }),
  streamUrl: (slug) => `${BASE}/api/polls/${slug}/stream`,
}

export function getVoterId() {
  let id = localStorage.getItem('pw_voter')
  if (!id) {
    id = 'v_' + crypto.randomUUID().replace(/-/g, '')
    localStorage.setItem('pw_voter', id)
  }
  return id
}
