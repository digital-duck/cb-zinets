import { t } from '../i18n.js'
import { LanguagePicker } from './LanguagePicker.js'
import { getStoredUser, getToken, clearToken, clearUser } from '../services/auth.js'

export function Header({ domainName = '' } = {}) {
  const el = document.createElement('header')
  el.className = 'cb-header'

  const topRow = document.createElement('div')
  topRow.className = 'cb-header__top'

  const logo = document.createElement('a')
  logo.className = 'cb-header__logo'
  logo.href = '#/'

  const logoMark = document.createElement('img')
  logoMark.className = 'cb-header__logo-mark'
  logoMark.src = `${import.meta.env.BASE_URL}brand/seal-zi-logo.png`
  logoMark.alt = ''
  logo.appendChild(logoMark)
  // app.title is "字 ConceptBook" — the seal-script mark above replaces the
  // leading 字 glyph, so only the text after it is appended here.
  logo.appendChild(document.createTextNode(t('app.title').replace(/^字\s*/, '')))
  topRow.appendChild(logo)

  if (domainName) {
    const sep = document.createElement('span')
    sep.className = 'cb-header__sep'
    sep.textContent = '›'
    topRow.appendChild(sep)

    const dn = document.createElement('span')
    dn.className = 'cb-header__domain'
    dn.textContent = domainName
    topRow.appendChild(dn)
  }

  const spacer = document.createElement('span')
  spacer.className = 'cb-header__spacer'
  topRow.appendChild(spacer)

  const nav = document.createElement('nav')
  nav.className = 'cb-header__nav'
  nav.innerHTML = `<a href="#/graph">Graph</a> <a href="#/book">Content</a> <a href="#/resources">Resources</a> <a href="#/settings">${t('nav.settings')}</a>`
  topRow.appendChild(nav)

  topRow.appendChild(LanguagePicker())

  const user = getStoredUser()
  if (user) {
    const userInfo = document.createElement('span')
    userInfo.className = 'cb-header__user'
    userInfo.textContent = `${user.username} (${user.role})`
    topRow.appendChild(userInfo)

    const logoutBtn = document.createElement('button')
    logoutBtn.className = 'cb-btn'
    logoutBtn.style.cssText = 'padding:4px 10px;font-size:.8rem;margin-left:8px'
    logoutBtn.textContent = 'Logout'
    logoutBtn.addEventListener('click', async () => {
      const token = getToken()
      if (token) {
        try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'X-CB-Token': token } }) } catch { /* ignore */ }
      }
      clearToken()
      clearUser()
      window.location.hash = '/login'
    })
    topRow.appendChild(logoutBtn)
  }

  el.appendChild(topRow)

  return el
}
