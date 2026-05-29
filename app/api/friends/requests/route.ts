import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const userId = session.user.id

  const requests = await db.friendship.findMany({
    where: { addresseeId: userId, status: 'PENDING' },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({ requests })
}
