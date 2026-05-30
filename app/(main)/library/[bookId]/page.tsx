import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import BookDetailClient from '@/components/library/BookDetailClient'

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { bookId } = await params
  const book = await db.book.findUnique({
    where: { id: bookId, userId: session.user.id },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      synopsis: true,
      tags: true,
      userNotes: true,
      status: true,
      chapterIndex: true,
      chapterCount: true,
      isArchived: true,
      genre: true,
    },
  })
  if (!book) notFound()

  const progress = book.chapterCount && book.chapterCount > 0
    ? Math.round((book.chapterIndex / book.chapterCount) * 100)
    : 0

  const STATUS_LABELS: Record<string, string> = { READING: '在读', WANT: '想读', FINISHED: '已读' }

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link
          href="/library"
          style={{ color: 'var(--text-muted)', fontSize: '15px', textDecoration: 'none' }}
        >
          ← 书库
        </Link>
      </div>

      {/* Book info row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {/* Cover */}
        <div style={{ position: 'relative', width: '120px', height: '180px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(160deg, var(--accent-100), var(--bg-elevated))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '40px', fontWeight: 700, color: 'var(--accent-600)', opacity: 0.7 }}>
                {book.title[0]}
              </span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Noto Serif SC', serif" }}>
            {book.title}
          </h1>
          {book.author && (
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-secondary)' }}>{book.author}</p>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--accent-100)', color: 'var(--accent-700)', fontSize: '12px', fontWeight: 600 }}>
              {STATUS_LABELS[book.status]}
            </span>
            {book.genre && (
              <span style={{ padding: '3px 10px', borderRadius: '999px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {book.genre}
              </span>
            )}
          </div>
          {book.chapterCount && book.chapterCount > 0 && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              进度 {progress}%（第 {book.chapterIndex + 1}/{book.chapterCount} 章）
            </p>
          )}
        </div>
      </div>

      {/* Synopsis */}
      {book.synopsis && (
        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'var(--bg-elevated)' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{book.synopsis}</p>
        </div>
      )}

      {/* User notes */}
      {book.userNotes && (
        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', border: '1.5px dashed var(--border-subtle)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>我的备注</p>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>{book.userNotes}</p>
        </div>
      )}

      {/* Actions */}
      <BookDetailClient book={{ id: book.id, title: book.title, author: book.author, synopsis: book.synopsis, tags: book.tags, userNotes: book.userNotes, coverUrl: book.coverUrl, isArchived: book.isArchived }} />
    </div>
  )
}
