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

    const body = await request.json() as {
      status?: unknown
      title?: string
      author?: string | null
      synopsis?: string | null
      userNotes?: string | null
      genre?: string | null
      tags?: string[]
    }
    const { status, title, author, synopsis, userNotes, genre, tags } = body

    // 元数据更新（编辑信息）
    if (title !== undefined || synopsis !== undefined || userNotes !== undefined || author !== undefined || genre !== undefined || tags !== undefined) {
      if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
        return NextResponse.json({ error: '书名不能为空' }, { status: 400 })
      }
      const updated = await db.book.update({
        where: { id, userId: session.user.id },
        data: {
          ...(title !== undefined && { title: title.trim() }),
          ...(author !== undefined && { author: author || null }),
          ...(synopsis !== undefined && { synopsis: synopsis || null }),
          ...(userNotes !== undefined && { userNotes: userNotes || null }),
          ...(genre !== undefined && { genre: genre || null }),
          ...(tags !== undefined && { tags }),
        },
      })
      return NextResponse.json(updated)
    }

    // 状态更新
    if (!VALID_STATUSES.includes(status as BookStatus)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
    }

    const updated = await db.book.update({
      where: { id, userId: session.user.id },
      data: { status: status as BookStatus },
    })

    // Fire-and-forget: create activity feed entry for social sync
    if (status === 'READING') {
      db.activityFeed.create({
        data: { userId: session.user.id, actionType: 'READING_STARTED', bookId: id },
      }).catch(() => {})
    } else if (status === 'FINISHED') {
      db.activityFeed.create({
        data: { userId: session.user.id, actionType: 'BOOK_FINISHED', bookId: id },
      }).catch(() => {})
    }

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
