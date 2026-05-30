import Link from 'next/link'
import Image from 'next/image'

interface FriendCardProps {
  friend: { id: string; username: string; avatarUrl?: string | null }
  readingBook?: { title: string } | null
}

export default function FriendCard({ friend, readingBook }: FriendCardProps) {
  return (
    <Link
      href={`/friends/${friend.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
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
          position: 'relative',
        }}
      >
        {friend.avatarUrl ? (
          <Image
            src={friend.avatarUrl}
            alt={friend.username}
            width={48}
            height={48}
            style={{ objectFit: 'cover' }}
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
    </Link>
  )
}
