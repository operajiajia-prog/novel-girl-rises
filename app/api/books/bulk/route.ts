import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile, keyFromUrl } from '@/lib/r2'
import type { BookStatus } from '@prisma/client'

const VALID_STATUSES: BookStatus[] = ['READING', 'WANT', 'FINISHED']

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await request.json()
    const { bookIds, action, status } = body as {
      bookIds: string[]
      action: 'status' | 'archive'
      status?: string
    }

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'bookIds 不能为空' }, { status: 400 })
    }

    if (action === 'status') {
      if (!VALID_STATUSES.includes(status as BookStatus)) {
        return NextResponse.json({ error: '无效状态' }, { status: 400 })
      }
      const result = await db.book.updateMany({
        where: { id: { in: bookIds }, userId: session.user.id },
        data: { status: status as BookStatus },
      })
      return NextResponse.json({ updated: result.count })
    }

    if (action === 'archive') {
      const result = await db.book.updateMany({
        where: { id: { in: bookIds }, userId: session.user.id },
        data: { isArchived: true },
      })
      return NextResponse.json({ updated: result.count })
    }

    return NextResponse.json({ error: '无效操作' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await request.json()
    const { bookIds } = body as { bookIds: string[] }

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json({ error: 'bookIds 不能为空' }, { status: 400 })
    }

    const books = await db.book.findMany({
      where: { id: { in: bookIds }, userId: session.user.id },
      select: { id: true, fileUrl: true },
    })

    // Clean up R2 files
    await Promise.all(books.map(b => deleteFile(keyFromUrl(b.fileUrl))))

    await db.book.deleteMany({
      where: { id: { in: books.map(b => b.id) }, userId: session.user.id },
    })

    return NextResponse.json({ deleted: books.length })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
