// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { book: { findUnique: vi.fn() } } }))
vi.mock('@/lib/r2', () => ({
  keyFromUrl: vi.fn().mockReturnValue('books/user1/123_test.txt'),
  downloadFile: vi.fn(),
}))
vi.mock('@/lib/txt-parser', () => ({
  parseTxtFile: vi.fn().mockReturnValue({
    title: '测试书', author: '测试作者', encoding: 'UTF-8',
    chapterCount: 2,
    chapters: [
      { index: 0, title: '第一章', charOffset: 0, content: '正文内容一' },
      { index: 1, title: '第二章', charOffset: 100, content: '正文内容二' },
    ],
    fullText: '...',
  }),
}))

import { GET } from '@/app/api/books/[id]/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { downloadFile } from '@/lib/r2'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.book.findUnique)
const mockDownload = vi.mocked(downloadFile)

function makeRequest(bookId = 'book1') {
  return new Request(`http://localhost/api/books/${bookId}`)
}

describe('GET /api/books/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('returns book with chapters on success', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce({
      id: 'book1', title: '测试书', userId: 'user1',
      fileUrl: 'https://r2.example.com/books/user1/test.txt',
      encoding: 'UTF-8', chapterIndex: 0, charOffset: 0, chapterCount: 2, author: '测试作者',
    } as any)
    mockDownload.mockResolvedValueOnce(Buffer.from('章节内容'))
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.chapters).toHaveLength(2)
    expect(body.book.title).toBe('测试书')
  })
})
