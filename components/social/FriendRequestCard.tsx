interface FriendRequestCardProps {
  requester: { id: string; username: string; avatarUrl?: string | null }
  onAccept: () => void
  onReject: () => void
}

export default function FriendRequestCard({ requester, onAccept, onReject }: FriendRequestCardProps) {
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
          background: requester.avatarUrl ? 'transparent' : 'var(--accent-950)',
        }}
      >
        {requester.avatarUrl ? (
          <img
            src={requester.avatarUrl}
            alt={requester.username}
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
            {requester.username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Username */}
      <p
        style={{
          margin: 0,
          flex: 1,
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {requester.username}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onAccept}
          style={{
            padding: '6px 14px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--accent-500)',
            color: 'var(--bg-base)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          接受
        </button>
        <button
          type="button"
          onClick={onReject}
          style={{
            padding: '6px 14px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          拒绝
        </button>
      </div>
    </div>
  )
}
