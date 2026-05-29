import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')

  // 1. Get current user's accepted friends (both directions)
  const friendships = await db.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
    },
  })

  // 2. Extract friend userIds (exclude self)
  const friendIds = friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  )

  if (friendIds.length === 0) {
    return NextResponse.json({ items: [], nextCursor: null })
  }

  // 3. Build where clause
  const where: Record<string, unknown> = {
    userId: { in: friendIds },
  }

  // 5. Support cursor pagination
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) }
  }

  // 4. Query ActivityFeed with user and book info
  const activities = await db.activityFeed.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      user: { select: { username: true, avatarUrl: true } },
      book: { select: { id: true, title: true, coverUrl: true } },
    },
  })

  // 6. Return { items, nextCursor }
  const nextCursor =
    activities.length === PAGE_SIZE
      ? (activities[activities.length - 1].createdAt as Date).toISOString()
      : null

  return NextResponse.json({ items: activities, nextCursor })
}
