import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

async function setArchived(
  _request: Request,
  { params }: Params,
  isArchived: boolean
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
  if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

  const updated = await db.book.update({ where: { id, userId: session.user.id }, data: { isArchived } })
  return NextResponse.json({ book: updated })
}

export function POST(request: Request, ctx: Params) {
  return setArchived(request, ctx, true)
}

export function DELETE(request: Request, ctx: Params) {
  return setArchived(request, ctx, false)
}
