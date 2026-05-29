import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''

  const users = await db.user.findMany({
    where: {
      username: {
        contains: q,
        mode: 'insensitive',
      },
      NOT: { id: session.user.id },
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
    take: 10,
  })

  return NextResponse.json({ users })
}
