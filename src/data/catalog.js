let _cache = null

export function clearCatalogCache() {
  _cache = null
}

export async function loadCatalog() {
  if (_cache) return _cache
  const res = await fetch(`${import.meta.env.BASE_URL}domains/catalog.json`)
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`)
  _cache = await res.json()
  return _cache
}
