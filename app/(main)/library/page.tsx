import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import LibraryClient from '@/components/books/LibraryClient'
import type { BookStatus } from '@prisma/client'

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { status } = await searchParams
  const VALID_STATUSES: BookStatus[] = ['READING', 'WANT', 'FINISHED']
  const activeFilter = VALID_STATUSES.includes(status as BookStatus) ? (status as BookStatus) : undefined
  const where = {
    userId: session.user.id,
    ...(activeFilter ? { status: activeFilter } : {}),
  }

  const books = await db.book.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      author: true,
      synopsis: true,
      coverUrl: true,
      genre: true,
      status: true,
      chapterIndex: true,
      chapterCount: true,
      updatedAt: true,
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          我的书库
        </h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {books.length > 0 ? `${books.length} 本` : ''}
        </span>
      </div>

      <LibraryClient
        initialBooks={books}
        initialFilter={activeFilter ?? 'ALL'}
      />
    </div>
  )
}
