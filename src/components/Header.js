import { t } from '../i18n.js'
import { LanguagePicker } from './LanguagePicker.js'

export function Header({ domainName = '' } = {}) {
  const el = document.createElement('header')
  el.className = 'cb-header'

  const topRow = document.createElement('div')
  topRow.className = 'cb-header__top'

  const logo = document.createElement('a')
  logo.className = 'cb-header__logo'
  logo.href = '#/'
  logo.textContent = t('app.title')
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

  topRow.appendChild(LanguagePicker())

  const nav = document.createElement('nav')
  nav.className = 'cb-header__nav'
  nav.innerHTML = `<a href="#/settings">${t('nav.settings')}</a> <a href="#/about">${t('nav.about')}</a>`
  topRow.appendChild(nav)

  el.appendChild(topRow)

  return el
}
