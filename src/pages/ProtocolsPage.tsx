import { useState } from 'react'
import { PROTOCOLS, type Protocol } from '../lib/constants'

type Category = 'all' | Protocol['category']

export function ProtocolsPage() {
  const [filter, setFilter] = useState<Category>('all')

  const categories: Category[] = ['all', 'lending', 'dex', 'staking', 'stablecoin', 'vault']
  const filtered = filter === 'all' ? PROTOCOLS : PROTOCOLS.filter(p => p.category === filter)

  return (
    <div className="protocols-page">
      <div className="protocols-page-header">
        <h2>HyperEVM Protocols</h2>
        <p>Explore DeFi protocols on HyperEVM (Chain 999)</p>
      </div>

      <div className="protocol-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`protocol-filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="protocol-grid">
        {filtered.map(protocol => (
          <a
            key={protocol.name}
            href={protocol.url}
            target="_blank"
            rel="noopener noreferrer"
            className="protocol-card"
          >
            <div className="protocol-card-header">
              <span className="protocol-card-name">{protocol.name}</span>
              <span className={`protocol-card-category ${protocol.category}`}>
                {protocol.category}
              </span>
            </div>
            <p className="protocol-card-desc">{protocol.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
