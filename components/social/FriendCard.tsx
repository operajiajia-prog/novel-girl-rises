interface FriendCardProps {
  friend: { id: string; username: string; avatarUrl?: string | null }
  readingBook?: { title: string } | null
}

export default function FriendCard({ friend, readingBook }: FriendCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: friend.avatarUrl ? 'transparent' : 'var(--accent-100)',
        }}
      >
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt={friend.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--accent-400)',
              userSelect: 'none',
            }}
          >
            {friend.username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {friend.username}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '12px',
            color: readingBook ? 'var(--text-muted)' : 'var(--text-disabled)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {readingBook ? `正在读「${readingBook.title}」` : '暂无在读'}
        </p>
      </div>
    </div>
  )
}
