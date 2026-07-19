// Pane control row (model/level/language selects) and the drag-to-resize
// splitter used by Compare mode.
import { LANGUAGES } from '../LanguagePicker.js'
import { LEVELS, MODELS } from './content.js'

export function makeSelect(options, current, cls) {
  const sel = document.createElement('select')
  if (cls) sel.className = cls
  options.forEach(({ value, label }) => {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    if (value === current) opt.selected = true
    sel.appendChild(opt)
  })
  return sel
}

export function makeControlRow(label, state, onChange) {
  const row = document.createElement('div')
  row.className = 'cb-book-pane__controls'
  if (label) {
    const lbl = document.createElement('span')
    lbl.className = 'cb-book-pane__label'
    lbl.textContent = label
    row.appendChild(lbl)
  }
  const modelSel = makeSelect(MODELS, state.model, 'cb-book-pane__select')
  modelSel.title = 'Model'
  modelSel.addEventListener('change', () => onChange('model', modelSel.value))
  row.appendChild(modelSel)

  const levelSel = makeSelect(
    LEVELS.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) })),
    state.level, 'cb-book-pane__select'
  )
  levelSel.title = 'Level'
  levelSel.addEventListener('change', () => onChange('level', levelSel.value))
  levelSel.style.display = 'none'
  row.appendChild(levelSel)

  const langSel = makeSelect(
    LANGUAGES.map(l => ({ value: l.code, label: l.label })),
    state.lang, 'cb-book-pane__select'
  )
  langSel.title = 'Language'
  langSel.addEventListener('change', () => onChange('lang', langSel.value))
  row.appendChild(langSel)

  return row
}

export function makeDragSplitter(getWrapper, onSplitChange) {
  const handle = document.createElement('div')
  handle.style.cssText = 'height:5px;background:#d1d5db;cursor:row-resize;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.15s'

  const grip = document.createElement('div')
  grip.style.cssText = 'width:40px;height:3px;border-radius:2px;background:#9ca3af;pointer-events:none'
  handle.appendChild(grip)

  let dragging = false
  handle.addEventListener('mouseenter', () => { if (!dragging) handle.style.background = '#bfdbfe' })
  handle.addEventListener('mouseleave', () => { if (!dragging) handle.style.background = '#d1d5db' })

  handle.addEventListener('mousedown', e => {
    e.preventDefault()
    dragging = true
    handle.style.background = '#93c5fd'

    // Transparent overlay covering the entire viewport (including iframes) so
    // mousemove/mouseup are received by the parent document even when the
    // cursor drifts into an iframe's browsing context.
    const overlay = document.createElement('div')
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;cursor:row-resize'
    document.body.appendChild(overlay)
    document.body.style.userSelect = 'none'

    const onMove = e => {
      const wrapper = getWrapper()
      if (!wrapper) return
      const rect = wrapper.getBoundingClientRect()
      const pct = Math.min(80, Math.max(20, (e.clientY - rect.top) / rect.height * 100))
      onSplitChange(pct)
    }

    const onUp = () => {
      dragging = false
      handle.style.background = '#d1d5db'
      document.body.removeChild(overlay)
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  return handle
}
