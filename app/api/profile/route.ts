import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const body = await request.json() as { username?: string; bio?: string }
  const { username, bio } = body

  if (username !== undefined) {
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({ error: '用户名格式不正确' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: '用户名已被占用' }, { status: 409 })
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { username, bio },
    select: { username: true, bio: true },
  })

  return NextResponse.json(updated)
}
