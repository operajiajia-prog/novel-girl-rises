import ActivityItem, { type ActivityItemProps } from './ActivityItem'

interface FeedListProps {
  items: ActivityItemProps['activity'][]
  emptyMessage?: string
}

export default function FeedList({ items, emptyMessage = '去添加好友吧' }: FeedListProps) {
  if (items.length === 0) {
    return (
      <p
        style={{
          textAlign: 'center',
          padding: '32px 0',
          fontSize: '14px',
          color: 'var(--text-muted)',
        }}
      >
        {emptyMessage}
      </p>
    )
  }

  return (
    <div>
      {items.map((item) => (
        <ActivityItem key={item.id} activity={item} />
      ))}
    </div>
  )
}
