import { useRef, useState } from 'react'
import { TokenIcon } from '../TokenIcon'
import type { DlnToken } from '../../lib/debridge'

export function BridgeTokenPicker({ label, token, tokens, onChange }: { label: string; token?: DlnToken; tokens: DlnToken[]; onChange: (address: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState(''), [open, setOpen] = useState(false)
  const normalized = query.trim().toLowerCase()
  const matches = tokens.filter(t => !normalized || `${t.symbol} ${t.name} ${t.address}`.toLowerCase().includes(normalized))
  function close() { dialog.current?.close(); setOpen(false) }
  return <div className="oslo-token-picker">
    <span className="oslo-swap-caption">{label}</span>
    <button type="button" className="oslo-token-trigger" aria-label={label} aria-haspopup="dialog" onClick={() => { setQuery(''); setOpen(true); dialog.current?.showModal() }} disabled={!token}>
      {token ? <><TokenIcon symbol={token.symbol} logo={token.logo} preferLogo size={28} /><span>{token.symbol}</span></> : 'Loading…'}<span aria-hidden="true">⌄</span>
    </button>
    <dialog ref={dialog} className="oslo-token-dialog" aria-label={label} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      {open && <><div className="oslo-swap-title"><h2>{label}</h2><button type="button" onClick={close} aria-label="Close asset picker">×</button></div>
        <label>Search assets<input autoFocus placeholder="Name, symbol or contract address" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="oslo-token-results">{matches.slice(0, 50).map(t => <button key={t.address} type="button" onClick={() => { onChange(t.address); close() }}>
          <TokenIcon symbol={t.symbol} logo={t.logo} preferLogo size={32} /><span><strong>{t.symbol}</strong><small>{t.name}</small><small>{t.address.slice(0, 8)}…{t.address.slice(-6)}</small></span>{token?.address === t.address && <span aria-label="Selected">✓</span>}
        </button>)}</div>
        {!matches.length && <p>No matching assets on this network.</p>}
        {matches.length > 50 && <p className="bridge-footnote">Showing the first 50 results. Search to narrow the list.</p>}
      </>}
    </dialog>
  </div>
}
