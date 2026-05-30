import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id
  const { id } = await params

  const book = await db.book.findUnique({ where: { id, userId } })
  if (!book) {
    return NextResponse.json({ error: '书籍不存在' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({})) as { targetUserId?: unknown }
  const { targetUserId } = body

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'MISSING_TARGET' }, { status: 400 })
  }

  if (targetUserId === userId) {
    return NextResponse.json({ error: 'CANNOT_RECOMMEND_SELF' }, { status: 400 })
  }

  const friendship = await db.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: userId },
      ],
    },
  })

  if (!friendship) {
    return NextResponse.json({ error: 'NOT_FRIENDS' }, { status: 403 })
  }

  await db.activityFeed.create({
    data: {
      userId: targetUserId,
      actionType: 'BOOK_RECOMMENDED',
      bookId: id,
      metadata: { fromUserId: userId, fromUsername: session.user.name ?? '' },
    },
  })

  return NextResponse.json({ ok: true })
}
