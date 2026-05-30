import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { BookStatus } from '@prisma/client'

const VALID_STATUSES: BookStatus[] = ['READING', 'FINISHED', 'WANT']

export async function GET(request: Request) {
  void request
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') ?? 'recent'
    const statusParam = searchParams.get('status')
    const archived = searchParams.get('archived') === 'true'

    const statusFilter = VALID_STATUSES.includes(statusParam as BookStatus)
      ? (statusParam as BookStatus)
      : undefined

    const orderBy =
      sort === 'title' ? { title: 'asc' as const }
      : sort === 'added' ? { createdAt: 'desc' as const }
      : { updatedAt: 'desc' as const }

    const books = await db.book.findMany({
      where: {
        userId: session.user.id,
        isArchived: archived,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy,
    })

    if (sort === 'progress') {
      books.sort((a, b) => {
        const pA = a.chapterCount ? a.chapterIndex / a.chapterCount : 0
        const pB = b.chapterCount ? b.chapterIndex / b.chapterCount : 0
        return pB - pA
      })
    }

    return NextResponse.json({ books })
  } catch (err) {
    console.error('GET /api/books error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
