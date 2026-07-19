import { setToken, setUser } from '../services/auth.js'

export function Login(container, params = {}) {
  container.innerHTML = ''

  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f9fafb'

  const card = document.createElement('div')
  card.style.cssText = [
    'background:#fff',
    'border:1px solid #e5e7eb',
    'border-radius:8px',
    'padding:40px',
    'width:340px',
    'box-shadow:0 2px 8px rgba(0,0,0,.08)',
  ].join(';')

  card.innerHTML = `
    <h1 style="margin:0 0 6px;display:flex;align-items:center;gap:8px;font-size:1.3rem;font-weight:700;color:#111;font-family:system-ui,sans-serif">
      <img src="${import.meta.env.BASE_URL}brand/seal-zi-logo.png" alt="" style="height:28px;width:auto;display:block">ConceptBook
    </h1>
    <p style="margin:0 0 28px;font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif">Sign in to continue</p>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Username</label>
      <input id="cb-login-user" type="text" autocomplete="username"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:24px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Password</label>
      <input id="cb-login-pass" type="password" autocomplete="current-password"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <button id="cb-login-btn" class="cb-btn" style="width:100%;padding:10px;font-size:1rem">Sign in</button>
    <div id="cb-login-google-wrap" style="display:none">
      <div style="display:flex;align-items:center;gap:10px;margin:18px 0;color:#9ca3af;font-size:.8rem;font-family:system-ui,sans-serif">
        <span style="flex:1;height:1px;background:#e5e7eb"></span>or<span style="flex:1;height:1px;background:#e5e7eb"></span>
      </div>
      <button id="cb-login-google" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;font-size:.95rem;font-family:system-ui,sans-serif;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:6px;cursor:pointer">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
    </div>
    <div id="cb-login-err" style="margin-top:12px;font-size:.875rem;color:#dc2626;text-align:center;min-height:20px;font-family:system-ui,sans-serif"></div>
  `

  wrap.appendChild(card)
  container.appendChild(wrap)

  const userInput = card.querySelector('#cb-login-user')
  const passInput = card.querySelector('#cb-login-pass')
  const loginBtn = card.querySelector('#cb-login-btn')
  const errEl = card.querySelector('#cb-login-err')
  const googleWrap = card.querySelector('#cb-login-google-wrap')
  const googleBtn = card.querySelector('#cb-login-google')

  userInput.focus()

  // Surface OAuth errors bounced back as #/login?error=...
  if (params.error) errEl.textContent = decodeURIComponent(params.error)

  // Show the Google button only when the backend has OAuth configured
  fetch('/api/auth/providers')
    .then(r => (r.ok ? r.json() : null))
    .then(p => { if (p?.google) googleWrap.style.display = '' })
    .catch(() => { /* backend down — password form still shows its own error */ })

  googleBtn.addEventListener('click', () => {
    // Full-page navigation: backend sets the OAuth state cookie, then
    // redirects to Google; callback returns to #/auth/callback?token=...
    window.location.href = '/api/auth/google/login'
  })

  async function doLogin() {
    errEl.textContent = ''
    loginBtn.disabled = true
    loginBtn.textContent = 'Signing in…'
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userInput.value.trim(), password: passInput.value }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        window.location.hash = '/'
      } else {
        const body = await res.json().catch(() => ({}))
        errEl.textContent = body.detail || 'Login failed'
      }
    } catch {
      errEl.textContent = 'Cannot connect to server'
    } finally {
      loginBtn.disabled = false
      loginBtn.textContent = 'Sign in'
    }
  }

  loginBtn.addEventListener('click', doLogin)
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin() })
  userInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus() })
}
