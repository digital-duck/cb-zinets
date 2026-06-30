let _cache = null
const _domainDetailCache = new Map()

export function clearCatalogCache() {
  _cache = null
  _domainDetailCache.clear()
}

export async function loadCatalog() {
  if (_cache) return _cache
  // no-cache: sends conditional GET (ETag/Last-Modified) so browser only
  // downloads the body when catalog.json actually changed after a generation run
  const res = await fetch(`${import.meta.env.BASE_URL}domains/catalog.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  _cache = await res.json()
  return _cache
}

export async function loadDomainDetail(domainId) {
  if (_domainDetailCache.has(domainId)) return _domainDetailCache.get(domainId)
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}domains/catalog/${encodeURIComponent(domainId)}.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error()
    const detail = await res.json()
    _domainDetailCache.set(domainId, detail)
    return detail
  } catch (_) {
    return null
  }
}
