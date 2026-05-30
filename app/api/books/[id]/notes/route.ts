import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const note = await db.readingNote.findUnique({
      where: { userId_bookId: { userId: session.user.id, bookId: id } },
      select: { statusText: true, updatedAt: true },
    })

    return NextResponse.json({ note })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const { statusText } = await request.json()
    if (typeof statusText !== 'string' || statusText.trim().length === 0 || statusText.trim().length > 200) {
      return NextResponse.json({ error: '书评须在 1–200 字之间' }, { status: 400 })
    }

    const note = await db.readingNote.upsert({
      where: { userId_bookId: { userId: session.user.id, bookId: id } },
      create: { userId: session.user.id, bookId: id, statusText: statusText.trim() },
      update: { statusText: statusText.trim() },
      select: { statusText: true, updatedAt: true },
    })

    return NextResponse.json({ note })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    await db.readingNote.deleteMany({
      where: { userId: session.user.id, bookId: id },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
