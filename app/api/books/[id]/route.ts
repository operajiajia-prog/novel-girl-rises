import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { downloadFile, keyFromUrl } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
}
