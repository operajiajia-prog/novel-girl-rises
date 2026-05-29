import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET: upsert Booklist for current user (create if not exists), return with entries + book details
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id

  const booklist = await db.booklist.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      entries: {
        orderBy: { order: 'asc' },
        include: {
          book: {
            select: { id: true, title: true, coverUrl: true, author: true },
          },
        },
      },
    },
  })

  return NextResponse.json({ booklist })
}

// POST body: { bookId }
//   - upsert booklist first
//   - check for duplicate entry (409 if exists)
//   - calculate next order (max existing order + 1, or 0)
//   - create BooklistEntry
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id
  const { bookId } = await req.json()

  const booklist = await db.booklist.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })

  const existing = await db.booklistEntry.findUnique({
    where: { booklistId_bookId: { booklistId: booklist.id, bookId } },
  })

  if (existing) {
    return NextResponse.json({ error: '书籍已在精选列表中' }, { status: 409 })
  }

  const agg = await db.booklistEntry.aggregate({
    where: { booklistId: booklist.id },
    _max: { order: true },
  })

  const nextOrder = agg._max.order !== null ? agg._max.order + 1 : 0

  const entry = await db.booklistEntry.create({
    data: {
      booklistId: booklist.id,
      bookId,
      order: nextOrder,
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
