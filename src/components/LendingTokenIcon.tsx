import { TokenIcon } from './TokenIcon'

const available = new Set(['wstHYPE', 'USDe', 'sUSDe', 'USDT0', 'USDHL', 'kHYPE', 'USR', 'beHYPE'])
export function LendingTokenIcon({ symbol, size = 26 }: { symbol: string; size?: number }) {
  const name = symbol === 'USD₮0' ? 'USDT0' : symbol
  const asset = available.has(name) ? name : /^PT-kHYPE-/.test(name) ? 'PT-kHYPE' : /^PT-sUSDe-/i.test(name) ? 'PT-sUSDe' : undefined
  const logo = asset ? `${import.meta.env.BASE_URL}tokens/hyperlend/${asset}.svg` : undefined
  return <TokenIcon symbol={symbol} size={size} logo={logo} preferLogo fallback="icon" />
}
