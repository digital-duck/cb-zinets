const TOKEN_KEY = 'cb_token'
const USER_KEY = 'cb_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}

/** Returns {X-CB-Token} header object if logged in, else {}. */
export function authHeaders() {
  const token = getToken()
  return token ? { 'X-CB-Token': token } : {}
}

/**
 * Validates the stored token against the API.
 * Returns the user object if valid, null otherwise.
 * Fast path: if no token in localStorage, returns null immediately (no fetch).
 */
export async function checkAuth() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch('/api/auth/me', { headers: { 'X-CB-Token': token } })
    if (res.ok) {
      const user = await res.json()
      setUser(user)
      return user
    }
    clearToken()
    clearUser()
    return null
  } catch {
    return null
  }
}

export async function apiLogout() {
  const token = getToken()
  if (token) {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CB-Token': token } }) } catch { /* ignore */ }
  }
  clearToken()
  clearUser()
}
