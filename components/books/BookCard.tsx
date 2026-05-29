import Link from 'next/link'
import Image from 'next/image'
import type { BookStatus } from '@prisma/client'
import BookContextMenu from '@/components/library/BookContextMenu'

type BookCardProps = {
  book: {
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
  onStatusChange?: (id: string, status: BookStatus) => void
  onDelete?: (id: string) => void
}

export default function BookCard({ book, onStatusChange, onDelete }: BookCardProps) {
  const progress =
    book.chapterCount && book.chapterCount > 0
      ? Math.round(((book.chapterIndex ?? 0) / book.chapterCount) * 100)
      : 0

  const cardContent = (
    <Link
      href={`/reader/${book.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 150ms ease-out',
      }}
      onMouseDown={(e) => {
        // Save card position for reader expand animation
        const rect = (e.currentTarget as HTMLAnchorElement).getBoundingClientRect()
        sessionStorage.setItem('reader-origin', JSON.stringify({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }))
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(0.97)'
      }}
      onMouseUp={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'
      }}
    >
      {/* Cover */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '2/3',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(160deg, var(--accent-100), var(--bg-elevated))`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: '"Noto Serif SC", serif',
                fontSize: '48px',
                fontWeight: 700,
                color: 'var(--accent-600)',
                userSelect: 'none',
                opacity: 0.7,
              }}
            >
              {book.title[0] ?? '书'}
            </span>
          </div>
        )}

        {/* Genre badge */}
        {book.genre && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              borderRadius: '999px',
              background: 'rgba(50, 35, 10, 0.55)',
              color: 'oklch(0.99 0 0)',
              fontSize: '11px',
              padding: '2px 7px',
              lineHeight: '1.4',
              fontWeight: 500,
            }}
          >
            {book.genre}
          </span>
        )}
      </div>

      {/* Title */}
      <p
        style={{
          marginTop: '6px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.4',
        }}
      >
        {book.title}
      </p>

      {/* Progress bar — only for READING */}
      {book.status === 'READING' && book.chapterCount && book.chapterCount > 0 ? (
        <div
          style={{
            marginTop: '6px',
            height: '2px',
            background: 'var(--border-default)',
            borderRadius: '999px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent-500)',
              borderRadius: '999px',
            }}
          />
        </div>
      ) : null}
    </Link>
  )

  if (onStatusChange && onDelete) {
    return (
      <BookContextMenu
        book={{ id: book.id, status: book.status as BookStatus }}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      >
        {cardContent}
      </BookContextMenu>
    )
  }

  return cardContent
}
