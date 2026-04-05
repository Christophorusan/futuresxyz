import { useState } from 'react'

export function EmbedPage({ title, url, description }: { title: string; url: string; description?: string }) {
  const [iframeError, setIframeError] = useState(false)

  return (
    <div className="embed-page">
      <div className="embed-header">
        <span className="embed-title">{title}</span>
        {description && <span className="embed-desc">{description}</span>}
        <a className="embed-link" href={url} target="_blank" rel="noopener noreferrer">
          Open in new tab
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      {iframeError ? (
        <div className="embed-fallback">
          <div className="embed-fallback-card">
            <h3>{title}</h3>
            <p>{description}</p>
            <a className="embed-fallback-btn" href={url} target="_blank" rel="noopener noreferrer">
              Launch {title}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
        </div>
      ) : (
        <iframe
          className="embed-iframe"
          src={url}
          title={title}
          allow="clipboard-write; clipboard-read"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onError={() => setIframeError(true)}
        />
      )}
    </div>
  )
}

/** For protocols that block iframe embedding */
export function ProtocolPage({ title, url, description, features }: { title: string; url: string; description: string; features?: string[] }) {
  return (
    <div className="embed-page">
      <div className="embed-fallback">
        <div className="embed-fallback-card">
          <h3>{title}</h3>
          <p className="embed-fallback-desc">{description}</p>
          {features && (
            <ul className="embed-fallback-features">
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
          <a className="embed-fallback-btn" href={url} target="_blank" rel="noopener noreferrer">
            Launch {title}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
