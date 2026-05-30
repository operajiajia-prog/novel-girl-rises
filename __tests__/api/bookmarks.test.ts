// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: { findUnique: vi.fn() },
    bookmark: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  },
}))

import { GET, POST, DELETE } from '@/app/api/books/[id]/bookmarks/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockBookFind = vi.mocked(db.book.findUnique)
const mockFindMany = vi.mocked(db.bookmark.findMany)
const mockCreate = vi.mocked(db.bookmark.create)
const mockBmFind = vi.mocked(db.bookmark.findUnique)
const mockDelete = vi.mocked(db.bookmark.delete)

const params = Promise.resolve({ id: 'book1' })

function makeGet(query = '') {
  return new Request(`http://localhost/api/books/book1/bookmarks${query}`)
}
function makePost(body: object) {
  return new Request('http://localhost/api/books/book1/bookmarks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
function makeDelete(query: string) {
  return new Request(`http://localhost/api/books/book1/bookmarks${query}`, { method: 'DELETE' })
}

describe('GET /api/books/[id]/bookmarks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(401)
  })

  it('returns user bookmarks for this book', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([{ id: 'bm1', chapterIndex: 3 }] as any)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bookmarks).toHaveLength(1)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', bookId: 'book1' } })
    )
  })
})

describe('POST /api/books/[id]/bookmarks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makePost({ chapterIndex: 1 }), { params })
    expect(res.status).toBe(401)
  })

  it('creates bookmark with chapterIndex', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockCreate.mockResolvedValueOnce({ id: 'bm1', chapterIndex: 2, charOffset: 0 } as any)
    const res = await POST(makePost({ chapterIndex: 2 }), { params })
    expect(res.status).toBe(201)
  })

  it('creates bookmark with optional label', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockCreate.mockResolvedValueOnce({ id: 'bm1', chapterIndex: 2, label: '精彩段落' } as any)
    const res = await POST(makePost({ chapterIndex: 2, label: '精彩段落' }), { params })
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ label: '精彩段落' }),
    }))
  })

  it('returns 409 on duplicate bookmark', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    const dupError = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    mockCreate.mockRejectedValueOnce(dupError)
    const res = await POST(makePost({ chapterIndex: 2 }), { params })
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/books/[id]/bookmarks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeDelete('?chapterIndex=2&charOffset=0'), { params })
    expect(res.status).toBe(401)
  })

  it('deletes bookmark by chapterIndex + charOffset', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBmFind.mockResolvedValueOnce({ id: 'bm1', userId: 'u1', bookId: 'book1' } as any)
    mockDelete.mockResolvedValueOnce({ id: 'bm1' } as any)
    const res = await DELETE(makeDelete('?chapterIndex=2&charOffset=0'), { params })
    expect(res.status).toBe(200)
  })

  it('returns 404 when bookmark not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBmFind.mockResolvedValueOnce(null)
    const res = await DELETE(makeDelete('?chapterIndex=99&charOffset=0'), { params })
    expect(res.status).toBe(404)
  })
})

// Additional edge case tests

describe('GET /api/books/[id]/bookmarks — 500', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(500)
  })
})

describe('POST /api/books/[id]/bookmarks — 404 book', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when book not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(null)
    const res = await POST(makePost({ chapterIndex: 1 }), { params })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/books/[id]/bookmarks — 500', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBmFind.mockRejectedValueOnce(new Error('DB error'))
    const res = await DELETE(makeDelete('?chapterIndex=2&charOffset=0'), { params })
    expect(res.status).toBe(500)
  })
})
