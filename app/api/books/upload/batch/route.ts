import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadFile, buildKey } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'

const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]

  if (files.length === 0) return NextResponse.json({ error: '未提供文件' }, { status: 400 })

  const succeeded: { bookId: string; title: string }[] = []
  const failed: { filename: string; error: string }[] = []

  for (const file of files) {
    try {
      if (!file.name.endsWith('.txt')) throw new Error('只支持 .txt 文件')
      if (file.size > MAX_SIZE) throw new Error('文件超过 10MB 限制')

      const buffer = Buffer.from(await file.arrayBuffer())
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

      try {
        await db.activityFeed.create({
          data: { userId: session.user.id, actionType: 'BOOK_ADDED', bookId: book.id },
        })
      } catch {}

      succeeded.push({ bookId: book.id, title: book.title })
    } catch (err) {
      failed.push({ filename: file.name, error: err instanceof Error ? err.message : '上传失败' })
    }
  }

  return NextResponse.json({ succeeded, failed })
}
