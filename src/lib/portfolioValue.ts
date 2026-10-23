/** Never hide known balances because an unrelated network failed. */
export function portfolioValue(connected: boolean, assets: { value: number | null }[] | undefined, incomplete: boolean): number | null {
  if (!connected || !assets) return null
  const priced = assets.filter((asset): asset is { value: number } => asset.value !== null && Number.isFinite(asset.value))
  // An empty failed response is unknown, not a zero-dollar wallet.
  if (!priced.length && (incomplete || assets.length > 0)) return null
  return priced.reduce((sum, asset) => sum + asset.value, 0)
}
