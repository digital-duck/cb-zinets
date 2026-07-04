let _cache = null
const _domainDetailCache = new Map()

// Fuzzy phrase matcher shared by the Home search and the book-browser
// sidebar: hanzi substring, or (backfilled) toneless-pinyin /
// pinyin-initials substring — e.g. "shou" or "szdt" both match 守株待兔.
export function matchesQuery(text, pinyin, pinyinInitials, q) {
  if (text.includes(q)) return true
  const qLower = q.toLowerCase()
  if (pinyin && pinyin.includes(qLower)) return true
  if (pinyinInitials && pinyinInitials.includes(qLower)) return true
  return false
}

export function clearCatalogCache() {
  _cache = null
  _domainDetailCache.clear()
}

export async function loadCatalog() {
  // no-cache: sends conditional GET (ETag/Last-Modified) so browser only
  // downloads the body when catalog.json actually changed after a generation
  // run. Always revalidate — returning _cache without checking left Home and
  // Domain blind to phrases generated in the same session; _cache remains as
  // a fallback only when the fetch itself fails.
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}domains/catalog.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
    _cache = await res.json()
    return _cache
  } catch (err) {
    if (_cache) return _cache
    throw err
  }
}

export async function loadDomainDetail(domainId) {
  // Same always-revalidate policy as loadCatalog: conditional GET is cheap
  // (304 when unchanged) and a regenerated book must show up in-session.
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}domains/catalog/${encodeURIComponent(domainId)}.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error()
    const detail = await res.json()
    _domainDetailCache.set(domainId, detail)
    return detail
  } catch (_) {
    return _domainDetailCache.get(domainId) ?? null
  }
}
