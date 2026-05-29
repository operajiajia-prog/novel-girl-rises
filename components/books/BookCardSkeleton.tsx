export default function BookCardSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      <div style={{ aspectRatio: '2/3', borderRadius: '12px', background: 'var(--bg-elevated)' }} />
      <div style={{ height: '13px', borderRadius: '4px', background: 'var(--bg-elevated)', width: '80%' }} />
      <div style={{ height: '13px', borderRadius: '4px', background: 'var(--bg-elevated)', width: '55%' }} />
    </div>
  )
}
