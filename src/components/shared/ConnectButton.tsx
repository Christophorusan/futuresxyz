import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi'
import { Link } from 'react-router-dom'
import { walletConnectProjectId } from '../../config/wagmi'

import { useEmailWallet, xLoginEnabled } from '../../contexts/EmailWalletContext'

export function ConnectButton() {
  const emailWallet = useEmailWallet()
  const { address, isConnected, chain, connector: activeConnector } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [available, setAvailable] = useState<Connector[]>([])
  const [checking, setChecking] = useState(false)
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (open) dialog.current?.showModal()
    else dialog.current?.close()
  }, [open])
  useEffect(() => {
    if (!open || isConnected) return
    let cancelled = false
    Promise.all(connectors.map(async connector => {
      try { return connector.id === 'walletConnect' || await connector.getProvider() ? connector : undefined }
      catch { return undefined }
    })).then(results => {
      if (!cancelled) { setAvailable(results.filter((c): c is Connector => !!c)); setChecking(false) }
    })
    return () => { cancelled = true }
  }, [connectors, open, isConnected])
  async function connectWallet(connector: Connector) {
    setMessage('')
    // WalletConnect opens its own QR/deep-link modal outside this dialog.
    if (connector.id === 'walletConnect') setOpen(false)
    try { await connectAsync({ connector }); setOpen(false) }
    catch { setMessage('Connection was cancelled or could not complete. Unlock your wallet and try again.'); setOpen(true) }
  }
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage('Copied.') }
    catch { setMessage('Copy is unavailable. Select the address or link to copy it manually.') }
  }
  return <>
    <button className={`connect-btn ${isConnected ? 'connected' : ''}`} disabled={isPending} aria-label={isConnected ? 'Manage connected wallet' : 'Connect wallet'} onClick={() => { setMessage(''); setChecking(!isConnected); setAvailable([]); setOpen(true) }}>
      {isPending ? 'Connecting…' : address && isConnected ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect Wallet'}
    </button>
    {createPortal(<dialog className="wallet-dialog" ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby={titleId}>
      <header><h2 id={titleId}>{isConnected ? 'Your wallet' : 'Connect a wallet'}</h2><button className="wallet-close" aria-label="Close wallet panel" onClick={() => setOpen(false)}>×</button></header>
      {isConnected && address ? <>
        <p>{activeConnector?.name} · {chain?.name || 'Unsupported network'}</p>
        <p className="wallet-full-address">{address}</p>
        <div className="wallet-dialog-actions"><button onClick={() => copy(address)}>Copy address</button><Link to="/wallet?action=send" onClick={() => setOpen(false)}>Send / receive</Link><Link to="/wallet" onClick={() => setOpen(false)}>Wallet overview</Link></div>
        <button className="wallet-disconnect" onClick={async () => { try { if (emailWallet?.authenticated) await emailWallet.logout(); disconnect(); setOpen(false) } catch { setMessage('Sign out could not complete. Please try again.') } }}>Disconnect wallet</button>
      </> : <>
        {emailWallet && <div className="wallet-choice-list">
          <p>No wallet yet? Sign in to create one.</p>
          {emailWallet.authenticated ? <><button disabled={!emailWallet.ready} onClick={async () => { try { await emailWallet.restore(); setOpen(false) } catch { setMessage('Your wallet is still loading. Please try again shortly.') } }}>Use your email or social wallet</button><button onClick={async () => { try { await emailWallet.logout() } catch { setMessage('Sign out could not complete. Please try again.') } }}>Sign out of account</button></> : <>
          <button disabled={!emailWallet.ready} onClick={() => { setOpen(false); emailWallet.login('email') }}>Continue with email<span>Verify a code. Your wallet is created for you.</span></button>
          {xLoginEnabled && <button disabled={!emailWallet.ready} onClick={() => { setOpen(false); emailWallet.login('twitter') }}>Continue with X<span>Sign in with your X account</span></button>}
          </>}
          <p className="wallet-help">Sign-in and wallet creation are powered by Privy. You approve transactions with your wallet.</p>
        </div>}
        {emailWallet && <div className="wallet-choice-list"><button disabled={!emailWallet.ready} onClick={() => { setOpen(false); emailWallet.connectWallet() }}>Connect an existing wallet<span>Browser extension or mobile wallet</span></button></div>}
        <p>Choose a wallet available on this device. Your wallet approves connections and signs transactions.</p>
        {checking && <p role="status">Looking for wallets…</p>}
        <div className="wallet-choice-list">{available.map(connector => <button key={connector.uid} disabled={isPending} onClick={() => connectWallet(connector)}>{connector.name === 'Injected' ? 'Browser wallet' : connector.name}<span>{connector.id === 'walletConnect' ? 'Mobile wallets & QR code' : 'Available on this device'}</span></button>)}</div>
        {!emailWallet && !checking && !available.length && <p>No wallet was detected. Open this site inside your wallet app’s browser, or use a desktop wallet extension.</p>}
        {!emailWallet && !walletConnectProjectId && <p className="wallet-help">Mobile app pairing by QR code is not enabled yet. A wallet’s built-in browser can connect directly.</p>}
        <button onClick={() => copy(window.location.href)}>Copy this page’s link</button>
      </>}
      {message && <p role="status">{message}</p>}
    </dialog>, document.body)}
  </>
}
