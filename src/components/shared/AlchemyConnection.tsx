import { useState } from 'react'
import { alchemyApiKey } from '../../config/alchemy'
import { alchemyRead } from '../../lib/alchemyData'
export function AlchemyConnection() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  async function check() {
    setBusy(true)
    try {
      const chain = await alchemyRead<string>('eth_chainId', [])
      if (chain !== '0x3e7') throw new Error('Unable to connect to the correct network.')
      const block = await alchemyRead<string>('eth_blockNumber', [])
      if (!/^0x[\da-f]+$/i.test(block)) throw new Error('The network returned an unexpected response.')
      setStatus('Connected to HyperEVM. Balance updates are available. This does not check whether payments can be sent.')
    } catch (e) { setStatus((e as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="lending-card"><h3>Connection</h3><p>Balances update through the HyperEVM network.</p>
    {alchemyApiKey && <button disabled={busy} onClick={check}>{busy ? 'Checking…' : 'Check connection'}</button>}{status && <p role="status">{status}</p>}
  </section>
}
