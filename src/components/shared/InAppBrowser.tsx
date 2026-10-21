import { useEffect, useRef, useState } from 'react'
import './InAppBrowser.css'

export function openInOslo(url: string) {
  window.dispatchEvent(new CustomEvent('oslo-open-provider', { detail: url }))
}

export function InAppBrowser() {
  const [url, setUrl] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const open = (value: string) => {
      try {
        const destination = new URL(value, location.href)
        if (destination.protocol === 'https:' && destination.origin !== location.origin) setUrl(destination.href)
      } catch { /* Ignore malformed destinations. */ }
    }
    const intercept = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return
      const destination = new URL(anchor.href)
      if (destination.protocol !== 'https:' || destination.origin === location.origin) return
      event.preventDefault()
      open(destination.href)
    }
    const requested = (event: Event) => { if (event instanceof CustomEvent && typeof event.detail === 'string') open(event.detail) }
    document.addEventListener('click', intercept, true)
    document.addEventListener('auxclick', intercept, true)
    window.addEventListener('oslo-open-provider', requested)
    return () => {
      document.removeEventListener('click', intercept, true)
      document.removeEventListener('auxclick', intercept, true)
      window.removeEventListener('oslo-open-provider', requested)
    }
  }, [])
  useEffect(() => {
    if (url && !dialog.current?.open) dialog.current?.showModal()
    if (!url && dialog.current?.open) dialog.current.close()
  }, [url])
  const blocked = url ? new URL(url).hostname === 'app.hyperunit.xyz' : false
  return <dialog ref={dialog} className="oslo-provider-panel" aria-labelledby="oslo-provider-title" onCancel={() => setUrl(null)} onClose={() => setUrl(null)}>
    <header><div><small>OSLO · CONNECTED SERVICE</small><h2 id="oslo-provider-title">{url ? new URL(url).hostname : 'Connected service'}</h2></div><button onClick={() => setUrl(null)}>Back to Oslo ×</button></header>
    <p className="oslo-provider-note">This is the provider’s website inside Oslo. If it stays blank or a wallet action is unavailable, the provider may not support embedded access. Close this panel to return to your portfolio.</p>
    {blocked && <div className="oslo-provider-unavailable"><h3>This service needs an Oslo integration</h3><p>Hyperunit does not allow its deposit or withdrawal interface to appear inside other apps. This flow is unavailable inside Oslo for now.</p><button onClick={() => setUrl(null)}>Return to Oslo</button></div>}
    {url && !blocked && <iframe key={url} src={url} title={`Connected service: ${new URL(url).hostname}`} sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="strict-origin-when-cross-origin" />}
  </dialog>
}
