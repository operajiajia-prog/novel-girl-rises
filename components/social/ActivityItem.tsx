type ActivityType = 'BOOK_ADDED' | 'READING_STARTED' | 'BOOK_FINISHED' | 'BOOKLIST_UPDATED'

export interface ActivityItemProps {
  activity: {
    id: string
    actionType: ActivityType
    createdAt: string
    user: { username: string; avatarUrl?: string | null }
    book?: { title: string; coverUrl?: string | null } | null
  }
}

function getActionText(actionType: ActivityType, bookTitle?: string): string {
  switch (actionType) {
    case 'BOOK_ADDED':
      return `「${bookTitle}」加入书库`
    case 'READING_STARTED':
      return `开始阅读「${bookTitle}」`
    case 'BOOK_FINISHED':
      return `读完了「${bookTitle}」🎉`
    case 'BOOKLIST_UPDATED':
      return '更新了书单'
  }
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const { user, actionType, book, createdAt } = activity
  const actionText = getActionText(actionType, book?.title)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: user.avatarUrl ? 'transparent' : 'var(--accent-100)',
        }}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--accent-400)',
              userSelect: 'none',
            }}
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
          <span style={{ fontWeight: 600 }}>{user.username}</span>
          <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>{actionText}</span>
        </p>
        <time
          dateTime={createdAt}
          style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}
        >
          {new Date(createdAt).toLocaleDateString('zh-CN')}
        </time>
      </div>
    </div>
  )
}
