import { setToken, setUser } from '../services/auth.js'

export function Signup(container) {
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
    <p style="margin:0 0 28px;font-size:.85rem;color:#6b7280;font-family:system-ui,sans-serif">Create an account</p>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Username</label>
      <input id="cb-su-user" type="text" autocomplete="username"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Password</label>
      <input id="cb-su-pass" type="password" autocomplete="new-password"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <div style="margin-bottom:24px">
      <label style="display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:4px;font-family:system-ui,sans-serif">Email <span style="font-weight:400;color:#9ca3af">(optional)</span></label>
      <input id="cb-su-email" type="email" autocomplete="email"
        style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:8px 12px;font-size:1rem;outline:none;font-family:system-ui,sans-serif">
    </div>
    <button id="cb-su-btn" class="cb-btn" style="width:100%;padding:10px;font-size:1rem">Create account</button>
    <div id="cb-su-err" style="margin-top:12px;font-size:.875rem;color:#dc2626;text-align:center;min-height:20px;font-family:system-ui,sans-serif"></div>
    <p style="margin:16px 0 0;text-align:center;font-size:.875rem;color:#6b7280;font-family:system-ui,sans-serif">
      Already have an account? <a href="#/login" style="color:#2563eb;text-decoration:none">Sign in</a>
    </p>
  `

  wrap.appendChild(card)
  container.appendChild(wrap)

  const userInput = card.querySelector('#cb-su-user')
  const passInput = card.querySelector('#cb-su-pass')
  const emailInput = card.querySelector('#cb-su-email')
  const btn = card.querySelector('#cb-su-btn')
  const errEl = card.querySelector('#cb-su-err')

  userInput.focus()

  async function doSignup() {
    errEl.textContent = ''
    btn.disabled = true
    btn.textContent = 'Creating…'
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userInput.value.trim(),
          password: passInput.value,
          email: emailInput.value.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        window.location.hash = '/'
      } else {
        const body = await res.json().catch(() => ({}))
        errEl.textContent = body.detail || 'Sign up failed'
      }
    } catch {
      errEl.textContent = 'Cannot connect to server'
    } finally {
      btn.disabled = false
      btn.textContent = 'Create account'
    }
  }

  btn.addEventListener('click', doSignup)
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSignup() })
  userInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus() })
}
