import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import BookGrid from '@/components/books/BookGrid'

export default async function FriendLibraryPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { userId } = await params
  const myId = session.user.id

  const friendship = await db.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: myId, addresseeId: userId },
        { requesterId: userId, addresseeId: myId },
      ],
    },
  })
  if (!friendship) notFound()

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, avatarUrl: true },
  })
  if (!user) notFound()

  const books = await db.book.findMany({
    where: { userId, isArchived: false },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      genre: true,
      status: true,
      chapterIndex: true,
      chapterCount: true,
      updatedAt: true,
    },
  })

  return (
    <div className="space-y-6" style={{ paddingBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--accent-100)',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.username} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--accent-600)',
              }}
            >
              {user.username[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            {user.username} 的书库
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            {books.length > 0 ? `${books.length} 本` : ''}
          </p>
        </div>
      </div>

      {books.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '48px 0',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          Ta 的书库是空的
        </p>
      ) : (
        <BookGrid books={books} />
      )}
    </div>
  )
}
