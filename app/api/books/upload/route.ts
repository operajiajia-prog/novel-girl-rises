import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadFile, buildKey } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'

const MAX_SIZE = 50 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: '未提供文件' }, { status: 400 })
    }

    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: '只支持 .txt 文件' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '文件超过 50MB 限制' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = parseTxtFile(buffer, file.name)

    const key = buildKey(session.user.id, file.name)
    const fileUrl = await uploadFile(key, buffer, 'text/plain')

    const book = await db.book.create({
      data: {
        userId: session.user.id,
        title: parsed.title,
        author: parsed.author ?? undefined,
        fileUrl,
        encoding: parsed.encoding,
        chapterCount: parsed.chapterCount,
        fileSizeBytes: file.size,
        status: 'WANT',
      },
    })

    await db.activityFeed.create({
      data: { userId: session.user.id, actionType: 'BOOK_ADDED', bookId: book.id },
    })

    return NextResponse.json({ book }, { status: 201 })
  } catch (err) {
    console.error('POST /api/books/upload error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
