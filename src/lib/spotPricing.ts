/** Spot context arrays can contain markets absent from the metadata universe.
 * Match the explicit market identifier; never assume matching array positions. */
export function spotContextMap<T extends { coin: string }>(contexts: T[]): Map<string, T> {
  return new Map(contexts.map(context => [context.coin, context]))
}
export function spotValuationPrice(context: { markPx?: string | null; midPx?: string | null } | undefined): number | null {
  // Mark price avoids valuing illiquid holdings at a wide bid/ask midpoint.
  const price = Number(context?.markPx)
  return Number.isFinite(price) && price > 0 ? price : null
}
