import { useEffect, useState } from 'react'
const key = 'fav-markets'
function read(): Set<string> {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || '[]'); return new Set(Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []) } catch { return new Set() }
}
export function useFavorites() {
  const [favorites, setFavorites] = useState(read)
  useEffect(() => {
    const update = () => setFavorites(read())
    window.addEventListener('oslo-favorites', update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener('oslo-favorites', update); window.removeEventListener('storage', update) }
  }, [])
  const toggleFav = (symbol: string) => {
    const next = new Set(favorites)
    if (next.has(symbol)) next.delete(symbol); else next.add(symbol)
    setFavorites(next)
    try { localStorage.setItem(key, JSON.stringify([...next])); window.dispatchEvent(new Event('oslo-favorites')) } catch { /* Remains usable in this session when storage is unavailable. */ }
  }
  return { favorites, toggleFav }
}
