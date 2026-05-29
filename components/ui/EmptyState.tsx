interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
}

export default function EmptyState({ icon = '📚', title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '40px', lineHeight: 1 }}>{icon}</span>
      <p
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          margin: '8px 0 0',
        }}
      >
        {title}
      </p>
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {description}
        </p>
      )}
    </div>
  )
}
