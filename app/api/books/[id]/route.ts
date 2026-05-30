import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile, downloadFile, keyFromUrl } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'
import type { BookStatus } from '@prisma/client'

const VALID_STATUSES: BookStatus[] = ['READING', 'WANT', 'FINISHED']

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const key = keyFromUrl(book.fileUrl)
    const buffer = await downloadFile(key)
    const parsed = parseTxtFile(buffer, book.title)

    return NextResponse.json({
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        chapterIndex: book.chapterIndex,
        charOffset: book.charOffset,
        chapterCount: parsed.chapterCount,
      },
      chapters: parsed.chapters.map(c => ({
        index: c.index,
        title: c.title,
        content: c.content,
      })),
    })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const body = await request.json() as { status?: unknown }
    const { status } = body

    if (!VALID_STATUSES.includes(status as BookStatus)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }

    const updated = await db.book.update({
      where: { id, userId: session.user.id },
      data: { status: status as BookStatus },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const key = keyFromUrl(book.fileUrl)
    await deleteFile(key)
    await db.book.delete({ where: { id, userId: session.user.id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
