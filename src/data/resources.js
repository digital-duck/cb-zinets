let _cache = null

export async function loadResources() {
  if (_cache) return _cache
  const res = await fetch(`${import.meta.env.BASE_URL}resources.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load resources: ${res.status}`)
  _cache = await res.json()
  return _cache
}
