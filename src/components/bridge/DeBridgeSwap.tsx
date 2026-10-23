import { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useTheme } from '../../contexts/ThemeContext'

type Widget = {
  setExternalEVMWallet: (wallet: { provider: unknown; name: string }) => void
  disconnect: () => void
}
declare global {
  interface Window { deBridge?: { widget: (options: Record<string, unknown>) => Promise<Widget> } }
}
let loader: Promise<void> | undefined
let instance: Promise<Widget> | undefined
let element: HTMLDivElement | undefined
let attachedOsloWallet = false
function loadScript() {
  if (!loader) loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://app.debridge.com/assets/scripts/widget.js'
    script.async = true
    const timer = window.setTimeout(() => { loader = undefined; script.remove(); reject(new Error('Timed out loading deBridge.')) }, 25000)
    script.onload = () => { clearTimeout(timer); resolve() }
    script.onerror = () => { clearTimeout(timer); loader = undefined; script.remove(); reject(new Error('Could not load deBridge.')) }
    document.head.appendChild(script)
  })
  return loader
}

export function DeBridgeSwap() {
  const host = useRef<HTMLDivElement>(null)
  const { connector, address } = useAccount()
  const { theme } = useTheme()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let cancelled = false
    const container = host.current!
    setLoading(true); setError('')
    async function mount() {
      await loadScript()
      if (cancelled) return
      if (!element) { element = document.createElement('div'); element.id = 'oslo-debridge-widget' }
      container.appendChild(element)
      if (!instance) instance = window.deBridge!.widget({
        element: element.id, v: '1', mode: 'deswap', title: 'Cross-chain swap',
        width: '100%', height: 720, theme, lang: 'en', inputChain: 42161, outputChain: 1,
        styles: btoa(JSON.stringify({ fontFamily: 'Inter, sans-serif', primary: '#5088f4', borderRadius: 12 })),
      }).catch(error => { instance = undefined; throw error })
      await instance
      if (!cancelled) setLoading(false)
    }
    void mount().catch(() => { if (!cancelled) { setError('deBridge could not load. Try again or open its official app.'); setLoading(false) } })
    return () => { cancelled = true; if (element?.parentElement === container) container.removeChild(element) }
    // Keep the provider's form and transaction state intact across theme changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])
  useEffect(() => {
    let cancelled = false
    if (!instance || loading) return
    void instance.then(async widget => {
      if (connector && address) {
        const provider = await connector.getProvider()
        if (!cancelled) { widget.setExternalEVMWallet({ provider, name: connector.name }); attachedOsloWallet = true }
      } else if (!cancelled && attachedOsloWallet) { widget.disconnect(); attachedOsloWallet = false }
    }).catch(() => { if (!cancelled) setError('Connect your wallet inside deBridge to continue.') })
    return () => { cancelled = true }
  }, [connector, address, loading])
  return <section className="bridge-provider-panel">
    <p className="bridge-description">Swap across supported networks, including Solana, Arbitrum and Ethereum. Choose your source asset and destination below.</p>
    {loading && <p role="status">Loading deBridge…</p>}
    {error && <p role="alert">{error} <button onClick={() => setAttempt(n => n + 1)}>Retry</button></p>}
    <div ref={host} className="debridge-host" />
    <p className="bridge-footnote">Powered by deBridge. It provides live routes, fees, transaction review, and transfer status. Solana wallets connect inside this panel. HyperEVM and Hyperliquid trading balances are separate destinations.</p>
    <a href="https://app.debridge.com/" target="_blank" rel="noopener noreferrer">Open deBridge ↗</a>
  </section>
}
