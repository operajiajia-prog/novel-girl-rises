import BookCard from './BookCard'
import BookCardSkeleton from './BookCardSkeleton'
import EmptyState from '@/components/ui/EmptyState'
import type { BookStatus } from '@prisma/client'

type Book = {
  id: string
  title: string
  author?: string | null
  coverUrl?: string | null
  genre?: string | null
  status: string
  chapterIndex?: number | null
  chapterCount?: number | null
  updatedAt?: Date | null
}

type BookGridProps = {
  books?: Book[]
  loading?: boolean
  skeletonCount?: number
  onStatusChange?: (id: string, status: BookStatus) => void
  onDelete?: (id: string) => void
}

export default function BookGrid({
  books = [],
  loading = false,
  skeletonCount = 6,
  onStatusChange,
  onDelete,
}: BookGridProps) {
  if (!loading && books.length === 0) {
    return (
      <EmptyState
        icon="📖"
        title="暂无书籍"
        description="换个筛选条件，或者上传一本新小说吧"
      />
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px',
      }}
    >
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))
        : books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
    </div>
  )
}
