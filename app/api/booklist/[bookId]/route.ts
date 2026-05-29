import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: Promise<{ bookId: string }> }

// DELETE: find booklist, find entry, delete it (404 if not found)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const { bookId } = await params
  const userId = session.user.id

  const booklist = await db.booklist.findUnique({ where: { userId } })
  if (!booklist) {
    return NextResponse.json({ error: '精选列表不存在' }, { status: 404 })
  }

  const entry = await db.booklistEntry.findUnique({
    where: { booklistId_bookId: { booklistId: booklist.id, bookId } },
  })

  if (!entry) {
    return NextResponse.json({ error: '书籍不在精选列表中' }, { status: 404 })
  }

  await db.booklistEntry.delete({ where: { id: entry.id } })

  return NextResponse.json({ success: true })
}
