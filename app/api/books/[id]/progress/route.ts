import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
  if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

  const body = await request.json() as { chapterIndex?: number; charOffset?: number }
  const chapterIndex = body.chapterIndex ?? 0
  const charOffset = body.charOffset ?? 0

  const isLast = book.chapterCount != null && chapterIndex >= book.chapterCount - 1
  const status = isLast ? 'FINISHED' : 'READING'

  const updated = await db.book.update({
    where: { id },
    data: { chapterIndex, charOffset, status },
  })

  if (book.status !== 'READING' && status === 'READING') {
    await db.activityFeed.create({ data: { userId: session.user.id, actionType: 'READING_STARTED', bookId: book.id } })
  }
  if (status === 'FINISHED' && book.status !== 'FINISHED') {
    await db.activityFeed.create({ data: { userId: session.user.id, actionType: 'BOOK_FINISHED', bookId: book.id } })
  }

  return NextResponse.json({ book: updated })
}
