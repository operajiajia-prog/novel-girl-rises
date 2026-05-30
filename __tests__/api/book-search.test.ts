// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: { findUnique: vi.fn() },
  },
}))
vi.mock('@/lib/r2', () => ({
  downloadFile: vi.fn(),
  keyFromUrl: vi.fn((url: string) => url.replace('https://cdn.example.com/', '')),
}))
vi.mock('@/lib/txt-parser', () => ({
  parseTxtFile: vi.fn(),
}))

import { GET } from '@/app/api/books/[id]/search/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { downloadFile } from '@/lib/r2'
import { parseTxtFile } from '@/lib/txt-parser'

const mockAuth = vi.mocked(auth)
const mockBookFind = vi.mocked(db.book.findUnique)
const mockDownloadFile = vi.mocked(downloadFile)
const mockParseTxtFile = vi.mocked(parseTxtFile)

const params = Promise.resolve({ id: 'book1' })

function makeGet(query = '') {
  return new Request(`http://localhost/api/books/book1/search${query}`)
}

const mockBook = {
  id: 'book1',
  userId: 'u1',
  title: '测试书',
  fileUrl: 'https://cdn.example.com/books/u1/test.txt',
}

const mockChapters = [
  { index: 0, title: '第一章 序幕', charOffset: 0, content: '这是序幕的内容，描述了主角的背景故事。' },
  { index: 1, title: '第二章 开始', charOffset: 100, content: '主角开始了她的旅程，充满了未知的挑战。' },
  { index: 2, title: '第三章 高潮', charOffset: 200, content: '经历了重重困难，主角终于到达了目的地。' },
]

const mockParsed = {
  title: '测试书',
  author: null,
  encoding: 'utf8',
  chapterCount: 3,
  chapters: mockChapters,
  fullText: '',
}

describe('GET /api/books/[id]/search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeGet('?q=主角'), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(null)
    const res = await GET(makeGet('?q=主角'), { params })
    expect(res.status).toBe(404)
  })

  it('returns 404 when book does not belong to current user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'other-user' } } as any)
    mockBookFind.mockResolvedValueOnce(null)
    const res = await GET(makeGet('?q=主角'), { params })
    expect(res.status).toBe(404)
  })

  it('returns 400 when q is missing', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('MISSING_QUERY')
  })

  it('returns 400 when q exceeds 50 chars', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    const longQuery = 'a'.repeat(51)
    const res = await GET(makeGet(`?q=${longQuery}`), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('QUERY_TOO_LONG')
  })

  it('returns matching chapters with snippets', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    mockDownloadFile.mockResolvedValueOnce(Buffer.from('') as any)
    mockParseTxtFile.mockReturnValueOnce(mockParsed as any)

    const res = await GET(makeGet('?q=主角'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toBeDefined()
    expect(body.results.length).toBeGreaterThan(0)
    // 主角 appears in chapters 1 and 2
    const chapterIndices = body.results.map((r: { chapterIndex: number }) => r.chapterIndex)
    expect(chapterIndices).toContain(1)
    expect(chapterIndices).toContain(2)
    // Each result has required fields
    for (const result of body.results) {
      expect(result).toHaveProperty('chapterIndex')
      expect(result).toHaveProperty('chapterTitle')
      expect(result).toHaveProperty('snippet')
    }
  })

  it('search is case-insensitive', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    const chaptersWithEnglish = [
      { index: 0, title: 'Chapter One', charOffset: 0, content: 'Hello World, this is the first chapter.' },
      { index: 1, title: 'Chapter Two', charOffset: 100, content: 'Another chapter with HELLO in it.' },
    ]
    mockDownloadFile.mockResolvedValueOnce(Buffer.from('') as any)
    mockParseTxtFile.mockReturnValueOnce({
      ...mockParsed,
      chapters: chaptersWithEnglish,
      chapterCount: 2,
    } as any)

    const res = await GET(makeGet('?q=hello'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results.length).toBe(2)
  })

  it('returns empty results array when no match', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    mockDownloadFile.mockResolvedValueOnce(Buffer.from('') as any)
    mockParseTxtFile.mockReturnValueOnce(mockParsed as any)

    const res = await GET(makeGet('?q=不存在的词语xyz'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toEqual([])
  })

  it('returns at most 20 results', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(mockBook as any)
    // 30 chapters each containing the search term
    const manyChapters = Array.from({ length: 30 }, (_, i) => ({
      index: i,
      title: `第${i + 1}章`,
      charOffset: i * 100,
      content: `这是第${i + 1}章，包含关键词搜索目标。`,
    }))
    mockDownloadFile.mockResolvedValueOnce(Buffer.from('') as any)
    mockParseTxtFile.mockReturnValueOnce({
      ...mockParsed,
      chapters: manyChapters,
      chapterCount: 30,
    } as any)

    const res = await GET(makeGet('?q=关键词'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results.length).toBeLessThanOrEqual(20)
  })
})
