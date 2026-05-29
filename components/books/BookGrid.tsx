import BookCard from './BookCard'
import BookCardSkeleton from './BookCardSkeleton'

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
}

export default function BookGrid({
  books = [],
  loading = false,
  skeletonCount = 6,
}: BookGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}
    >
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))
        : books.map((book) => <BookCard key={book.id} book={book} />)}
    </div>
  )
}
