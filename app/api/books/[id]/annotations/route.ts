import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const annotations = await db.annotation.findMany({
      where: { userId: session.user.id, bookId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, chapterIndex: true, content: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({ annotations })
  } catch (err) {
    console.error('GET /api/books/[id]/annotations error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: Params
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const { chapterIndex, content } = await request.json()

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'CONTENT_EMPTY' }, { status: 400 })
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'TOO_LONG' }, { status: 400 })
    }
    if (typeof chapterIndex !== 'number' || chapterIndex < 0) {
      return NextResponse.json({ error: 'INVALID_CHAPTER' }, { status: 400 })
    }

    const annotation = await db.annotation.create({
      data: { userId: session.user.id, bookId: id, chapterIndex, content: content.trim() },
      select: { id: true, chapterIndex: true, content: true, createdAt: true },
    })

    return NextResponse.json({ annotation }, { status: 201 })
  } catch (err) {
    console.error('POST /api/books/[id]/annotations error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get('annotationId')

    const existing = await db.annotation.findUnique({
      where: { id: annotationId ?? '' },
    })
    if (!existing || existing.userId !== session.user.id || existing.bookId !== id) {
      return NextResponse.json({ error: '批注不存在' }, { status: 404 })
    }

    const { content } = await request.json()

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'CONTENT_EMPTY' }, { status: 400 })
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'TOO_LONG' }, { status: 400 })
    }

    const annotation = await db.annotation.update({
      where: { id: annotationId! },
      data: { content: content.trim() },
      select: { id: true, content: true, updatedAt: true },
    })

    return NextResponse.json({ annotation })
  } catch (err) {
    console.error('PATCH /api/books/[id]/annotations error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get('annotationId')

    const existing = await db.annotation.findUnique({
      where: { id: annotationId ?? '' },
    })
    if (!existing || existing.userId !== session.user.id || existing.bookId !== id) {
      return NextResponse.json({ error: '批注不存在' }, { status: 404 })
    }

    await db.annotation.delete({ where: { id: annotationId! } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/books/[id]/annotations error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
