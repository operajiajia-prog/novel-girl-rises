import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ userId: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { userId: targetUserId } = await params
  const currentUserId = session.user.id

  if (currentUserId === targetUserId) {
    return NextResponse.json({ error: '不能添加自己为好友' }, { status: 400 })
  }

  const targetUser = await db.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
    },
  })

  if (existing) {
    return NextResponse.json({ error: '好友请求已存在' }, { status: 409 })
  }

  const friendship = await db.friendship.create({
    data: {
      requesterId: currentUserId,
      addresseeId: targetUserId,
      status: 'PENDING',
    },
  })

  return NextResponse.json({ friendship }, { status: 201 })
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { userId: targetUserId } = await params
  const currentUserId = session.user.id

  const body = await req.json()
  const { action } = body

  const friendship = await db.friendship.findFirst({
    where: { requesterId: targetUserId, addresseeId: currentUserId, status: 'PENDING' },
  })

  if (!friendship) {
    return NextResponse.json({ error: '好友请求不存在' }, { status: 404 })
  }

  if (action === 'accept') {
    const updated = await db.friendship.update({
      where: { id: friendship.id },
      data: { status: 'ACCEPTED' },
    })
    return NextResponse.json({ friendship: updated })
  }

  if (action === 'reject') {
    await db.friendship.delete({ where: { id: friendship.id } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: '无效的操作' }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { userId: targetUserId } = await params
  const currentUserId = session.user.id

  const { count } = await db.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
    },
  })

  if (count === 0) {
    return NextResponse.json({ error: '好友关系不存在' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
