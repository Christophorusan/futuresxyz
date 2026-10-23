const entryKey = 'oslo:entered'
const appPaths = new Set(['/lending/aave', '/lending/morpho', '/lending/kamino', '/discover', '/bridge', '/wallet', '/payments', '/perps', '/1000x-perps', '/spot', '/predictions', '/lending', '/options', '/staking', '/portfolio', '/docs'])

export function entryDestination(location: { pathname: string; search: string; hash: string }) {
  return appPaths.has(location.pathname) ? location.pathname + location.search + location.hash : '/wallet'
}

export function hasEntered() {
  try { return sessionStorage.getItem(entryKey) === 'yes' } catch { return false }
}

export function rememberEntry() {
  try { sessionStorage.setItem(entryKey, 'yes') } catch { /* In-memory entry still works when storage is disabled. */ }
}
