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
    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.user.id, bookId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookmarks })
  } catch (err) {
    console.error('GET /api/books/[id]/bookmarks error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: Params
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const { id } = await params
  const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
  if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

  const { chapterIndex = 0, charOffset = 0, label } = await request.json()

  try {
    const bookmark = await db.bookmark.create({
      data: { userId: session.user.id, bookId: id, chapterIndex, charOffset, label: label ?? null },
    })
    return NextResponse.json({ bookmark }, { status: 201 })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: '书签已存在' }, { status: 409 })
    }
    throw err
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
    const chapterIndex = Number(searchParams.get('chapterIndex') ?? 0)
    const charOffset = Number(searchParams.get('charOffset') ?? 0)

    const bookmark = await db.bookmark.findUnique({
      where: { userId_bookId_chapterIndex_charOffset: { userId: session.user.id, bookId: id, chapterIndex, charOffset } },
    })
    if (!bookmark) return NextResponse.json({ error: '书签不存在' }, { status: 404 })

    await db.bookmark.delete({ where: { id: bookmark.id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/books/[id]/bookmarks error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
