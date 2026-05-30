import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

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
    if (!friendship) return NextResponse.json({ error: '无权访问' }, { status: 403 })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true },
    })
    if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

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

    return NextResponse.json({ user, books })
  } catch (err) {
    console.error('GET /api/users/[userId]/books error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
