import { Component, type ReactNode } from 'react'

// Old tabs may request a page chunk removed by a newer deployment.
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return <main className="lending-page"><section className="lending-card" role="alert">
      <h1>This page could not load</h1><p>Reload to get the latest version of Oslo.</p>
      <p>If you already submitted a transaction, check its activity before trying again.</p>
      <button onClick={() => window.location.reload()}>Reload app</button>
    </section></main>
  }
}
