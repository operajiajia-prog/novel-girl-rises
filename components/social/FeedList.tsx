import ActivityItem, { type ActivityItemProps } from './ActivityItem'
import EmptyState from '@/components/ui/EmptyState'

interface FeedListProps {
  items: ActivityItemProps['activity'][]
  emptyMessage?: string
}

export default function FeedList({ items, emptyMessage = '去添加好友吧' }: FeedListProps) {
  if (items.length === 0) {
    return (
      <EmptyState icon="👥" title="暂无动态" description="添加好友，一起记录阅读旅程" />
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
