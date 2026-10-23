import { TokenIcon } from './TokenIcon'

export function AssetLabel({ symbol, size = 20, label }: { symbol: string; size?: number; label?: string }) {
  return <span className="asset-label"><span aria-hidden="true"><TokenIcon symbol={symbol} size={size} fallback="icon" /></span><span>{label ?? symbol}</span></span>
}
