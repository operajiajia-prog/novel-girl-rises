import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { downloadFile, keyFromUrl } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'

function makeSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, 120)
  const start = Math.max(0, idx - 60)
  const end = Math.min(content.length, idx + query.length + 60)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const { id } = await params
    const book = await db.book.findUnique({ where: { id, userId: session.user.id } })
    if (!book) return NextResponse.json({ error: '书籍不存在' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) return NextResponse.json({ error: 'MISSING_QUERY' }, { status: 400 })
    if (q.length > 50) return NextResponse.json({ error: 'QUERY_TOO_LONG' }, { status: 400 })

    const key = keyFromUrl(book.fileUrl)
    const buffer = await downloadFile(key)
    const parsed = parseTxtFile(buffer, book.title)

    const results: { chapterIndex: number; chapterTitle: string; snippet: string }[] = []

    for (const chapter of parsed.chapters) {
      if (results.length >= 20) break
      const titleMatch = chapter.title.toLowerCase().includes(q.toLowerCase())
      const contentMatch = chapter.content.toLowerCase().includes(q.toLowerCase())
      if (titleMatch || contentMatch) {
        const snippet = makeSnippet(chapter.content, q)
        results.push({
          chapterIndex: chapter.index,
          chapterTitle: chapter.title,
          snippet,
        })
      }
    }

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
