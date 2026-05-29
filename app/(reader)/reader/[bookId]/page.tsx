import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { downloadFile, keyFromUrl } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'
import ReaderClient from '@/components/reader/ReaderClient'

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ bookId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { bookId } = await params
  const book = await db.book.findUnique({
    where: { id: bookId, userId: session.user.id },
  })
  if (!book) notFound()

  const key = keyFromUrl(book.fileUrl)
  const buffer = await downloadFile(key)
  const parsed = parseTxtFile(buffer, book.title)

  return (
    <ReaderClient
      book={{
        id: book.id,
        title: book.title,
        author: book.author ?? null,
        chapterIndex: book.chapterIndex,
        charOffset: book.charOffset,
        chapterCount: parsed.chapterCount,
      }}
      chapters={parsed.chapters.map(c => ({
        index: c.index,
        title: c.title,
        content: c.content,
      }))}
    />
  )
}
