export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="predictions-page">
      <div className="page-placeholder">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
