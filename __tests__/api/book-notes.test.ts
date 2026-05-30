// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from '@/app/api/books/[id]/notes/route'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: { findUnique: vi.fn() },
    readingNote: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
  },
}))

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeCtx(bookId = 'book1') {
  return { params: Promise.resolve({ id: bookId }) }
}

function makeRequest(body?: object) {
  return new Request('http://localhost', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/books/[id]/notes', () => {
  it('returns 401 when not logged in', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeRequest(), makeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await GET(makeRequest(), makeCtx())
    expect(res.status).toBe(404)
  })

  it('returns note: null when no review exists', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'book1' })
    ;(db.readingNote.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await GET(makeRequest(), makeCtx())
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.note).toBeNull()
  })

  it('returns note with statusText when review exists', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'book1' })
    ;(db.readingNote.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      statusText: '很好看！',
      updatedAt: new Date('2026-05-30'),
    })
    const res = await GET(makeRequest(), makeCtx())
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.note.statusText).toBe('很好看！')
  })
})

describe('POST /api/books/[id]/notes', () => {
  it('returns 401 when not logged in', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest({ statusText: 'good' }), makeCtx())
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ statusText: 'good' }), makeCtx())
    expect(res.status).toBe(404)
  })

  it('returns 400 when statusText exceeds 200 chars', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'book1' })
    const longText = 'a'.repeat(201)
    const res = await POST(makeRequest({ statusText: longText }), makeCtx())
    expect(res.status).toBe(400)
  })

  it('upserts the review and returns note', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'book1' })
    ;(db.readingNote.upsert as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      statusText: '不错',
      updatedAt: new Date('2026-05-30'),
    })
    const res = await POST(makeRequest({ statusText: '不错' }), makeCtx())
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.note.statusText).toBe('不错')
    expect(db.readingNote.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_bookId: { userId: 'user1', bookId: 'book1' } },
      })
    )
  })
})

describe('DELETE /api/books/[id]/notes', () => {
  it('returns 401 when not logged in', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeRequest(), makeCtx())
    expect(res.status).toBe(401)
  })

  it('deletes the review and returns ok', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.readingNote.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ count: 1 })
    const res = await DELETE(makeRequest(), makeCtx())
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(db.readingNote.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user1', bookId: 'book1' },
    })
  })
})
