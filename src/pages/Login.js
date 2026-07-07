import { setToken, setUser } from '../services/auth.js'

export function Login(container) {
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
    <div id="cb-login-err" style="margin-top:12px;font-size:.875rem;color:#dc2626;text-align:center;min-height:20px;font-family:system-ui,sans-serif"></div>
  `

  wrap.appendChild(card)
  container.appendChild(wrap)

  const userInput = card.querySelector('#cb-login-user')
  const passInput = card.querySelector('#cb-login-pass')
  const loginBtn = card.querySelector('#cb-login-btn')
  const errEl = card.querySelector('#cb-login-err')

  userInput.focus()

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
