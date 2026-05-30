// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: { findUnique: vi.fn() },
    annotation: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

import { GET, POST, PATCH, DELETE } from '@/app/api/books/[id]/annotations/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockBookFind = vi.mocked(db.book.findUnique)
const mockFindMany = vi.mocked(db.annotation.findMany)
const mockCreate = vi.mocked(db.annotation.create)
const mockFindUnique = vi.mocked(db.annotation.findUnique)
const mockUpdate = vi.mocked(db.annotation.update)
const mockDelete = vi.mocked(db.annotation.delete)

const params = Promise.resolve({ id: 'book1' })

function makeGet(query = '') {
  return new Request(`http://localhost/api/books/book1/annotations${query}`)
}
function makePost(body: object) {
  return new Request('http://localhost/api/books/book1/annotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
function makePatch(query: string, body: object) {
  return new Request(`http://localhost/api/books/book1/annotations${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
function makeDelete(query: string) {
  return new Request(`http://localhost/api/books/book1/annotations${query}`, { method: 'DELETE' })
}

describe('GET /api/books/[id]/annotations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(null)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(404)
  })

  it('returns all annotations for this book ordered by createdAt desc', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockFindMany.mockResolvedValueOnce([
      { id: 'a2', chapterIndex: 3, content: '第二条', createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') },
      { id: 'a1', chapterIndex: 1, content: '第一条', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    ] as any)
    const res = await GET(makeGet(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.annotations).toHaveLength(2)
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'u1', bookId: 'book1' },
      orderBy: { createdAt: 'desc' },
    }))
  })
})

describe('POST /api/books/[id]/annotations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makePost({ chapterIndex: 0, content: '批注内容' }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce(null)
    const res = await POST(makePost({ chapterIndex: 0, content: '批注内容' }), { params })
    expect(res.status).toBe(404)
  })

  it('returns 400 when content is empty', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    const res = await POST(makePost({ chapterIndex: 0, content: '   ' }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('CONTENT_EMPTY')
  })

  it('returns 400 when content exceeds 500 chars', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    const res = await POST(makePost({ chapterIndex: 0, content: 'a'.repeat(501) }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('TOO_LONG')
  })

  it('returns 400 when chapterIndex is negative', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    const res = await POST(makePost({ chapterIndex: -1, content: '批注内容' }), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('INVALID_CHAPTER')
  })

  it('creates annotation and returns 201', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockBookFind.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockCreate.mockResolvedValueOnce({ id: 'a1', chapterIndex: 2, content: '很精彩', createdAt: new Date() } as any)
    const res = await POST(makePost({ chapterIndex: 2, content: '很精彩' }), { params })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.annotation.id).toBe('a1')
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'u1', bookId: 'book1', chapterIndex: 2, content: '很精彩' }),
    }))
  })
})

describe('PATCH /api/books/[id]/annotations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await PATCH(makePatch('?annotationId=a1', { content: '新内容' }), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when annotation not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await PATCH(makePatch('?annotationId=a1', { content: '新内容' }), { params })
    expect(res.status).toBe(404)
  })

  it('returns 404 when annotation belongs to another user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'a1', userId: 'u2', bookId: 'book1' } as any)
    const res = await PATCH(makePatch('?annotationId=a1', { content: '新内容' }), { params })
    expect(res.status).toBe(404)
  })

  it('updates content and returns updated annotation', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'a1', userId: 'u1', bookId: 'book1' } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'a1', content: '新内容', updatedAt: new Date() } as any)
    const res = await PATCH(makePatch('?annotationId=a1', { content: '新内容' }), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.annotation.id).toBe('a1')
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'a1' },
      data: expect.objectContaining({ content: '新内容' }),
    }))
  })
})

describe('DELETE /api/books/[id]/annotations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeDelete('?annotationId=a1'), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when annotation not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await DELETE(makeDelete('?annotationId=a1'), { params })
    expect(res.status).toBe(404)
  })

  it('deletes annotation and returns ok: true', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'a1', userId: 'u1', bookId: 'book1' } as any)
    mockDelete.mockResolvedValueOnce({ id: 'a1' } as any)
    const res = await DELETE(makeDelete('?annotationId=a1'), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'a1' } })
  })
})
