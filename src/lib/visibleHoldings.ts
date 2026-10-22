/** Only display holdings with a known USD value of at least one cent. */
export function visibleHoldings<T extends { value: number | null }>(assets: T[]): T[] {
  return assets.filter(asset => asset.value !== null && Number.isFinite(asset.value) && asset.value >= 0.01)
}
