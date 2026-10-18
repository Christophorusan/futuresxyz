import { useState } from 'react'
import { alchemyApiKey, smartWalletsEnabled, gasPolicyId } from '../../config/alchemy'
import { alchemyRead } from '../../lib/alchemyData'
export function AlchemyConnection() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  async function check() {
    setBusy(true)
    try {
      const chain = await alchemyRead<string>('eth_chainId', [])
      if (chain !== '0x3e7') throw new Error('The configured endpoint is not HyperEVM.')
      const block = await alchemyRead<string>('eth_blockNumber', [])
      if (!/^0x[\da-f]+$/i.test(block)) throw new Error('Invalid block response.')
      setStatus(`Alchemy HyperEVM responded at block ${BigInt(block)}. This checks RPC only, not signing or sponsorship.`)
    } catch (e) { setStatus((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="lending-card"><h3>Network connection</h3><p>{alchemyApiKey ? 'Alchemy RPC configured with public RPC fallback.' : 'Public HyperEVM RPC active. Alchemy is not configured.'}</p>
    <p>{smartWalletsEnabled ? 'Smart-account mode enabled.' : 'Smart-account mode disabled pending verification.'} {smartWalletsEnabled && gasPolicyId ? 'Gas policy configured; eligibility is checked per transaction.' : 'Gas sponsorship is not enabled.'}</p>
    {alchemyApiKey && <button disabled={busy} onClick={check}>{busy ? 'Checking…' : 'Check Alchemy connection'}</button>}{status && <p role="status">{status}</p>}
  </section>
}
