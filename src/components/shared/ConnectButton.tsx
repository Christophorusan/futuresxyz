import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function ConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [showOptions, setShowOptions] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  if (isConnected && address) {
    return (
      <button className="connect-btn connected" onClick={() => disconnect()}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    )
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleConnector = (connector: (typeof connectors)[number]) => {
    setConnectError(null)
    setShowOptions(false)
    connect(
      { connector },
      {
        onError: (err) => {
          console.error('Connect error:', err)
          setConnectError('Connection failed. Try again.')
          setTimeout(() => setConnectError(null), 4000)
        },
      }
    )
  }

  const handleConnect = () => {
    setConnectError(null)

    if (isMobile) {
      const wc = connectors.find(c => c.id === 'walletConnect')
      if (wc) {
        handleConnector(wc)
        return
      }
      const inj = connectors.find(c => c.id === 'injected')
      if (inj) {
        handleConnector(inj)
        return
      }
    }

    setShowOptions(!showOptions)
  }

  // Label injected wallets more clearly (Rabby, MetaMask, etc.)
  const getWalletLabel = (connector: (typeof connectors)[number]) => {
    if (connector.id === 'injected') {
      if (connector.name && connector.name !== 'Injected') return connector.name
      return 'Browser Wallet'
    }
    return connector.name
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="connect-btn"
        onClick={handleConnect}
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {connectError && (
        <div className="wallet-error">{connectError}</div>
      )}

      {showOptions && !isPending && (
        <div className="wallet-options">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              className="wallet-option"
              onClick={() => handleConnector(connector)}
            >
              {getWalletLabel(connector)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
