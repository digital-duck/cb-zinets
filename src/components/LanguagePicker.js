import { getLocale, setLocale } from '../i18n.js'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'ko', label: '한국어 (Korean)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
]

export { LANGUAGES }

export function LanguagePicker() {
  const sel = document.createElement('select')
  sel.className = 'cb-lang-picker'
  sel.title = 'Content language'

  const current = getLocale()
  LANGUAGES.forEach(({ code, label }) => {
    const opt = document.createElement('option')
    opt.value = code
    opt.textContent = label
    if (code === current) opt.selected = true
    sel.appendChild(opt)
  })

  sel.addEventListener('change', () => setLocale(sel.value))

  return sel
}
