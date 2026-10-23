import './AppLogo.css'
import { useState } from 'react'

/** Protocol artwork stays in its original colors on the neutral app surface. */
export function AppLogo({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState<string>()
  return <span className="finance-app-logo">
    {src && failed !== src ? <img src={src} alt={`${name} logo`} width="40" height="40" loading="lazy" onError={() => setFailed(src)} /> :
      <svg viewBox="0 0 24 24" role="img" aria-label={`${name} logo unavailable`}><rect x="4" y="4" width="6" height="6" rx="2"/><rect x="14" y="4" width="6" height="6" rx="2"/><rect x="4" y="14" width="6" height="6" rx="2"/><rect x="14" y="14" width="6" height="6" rx="2"/></svg>}
  </span>
}
