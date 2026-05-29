// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: { book: { findUnique: vi.fn(), update: vi.fn() }, activityFeed: { create: vi.fn() } }
}))

import { PATCH } from '@/app/api/books/[id]/progress/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.book.findUnique)
const mockUpdate = vi.mocked(db.book.update)
const mockActivityCreate = vi.mocked(db.activityFeed.create)

function makeRequest(body: object) {
  return new Request('http://localhost/api/books/book1/progress', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/books/[id]/progress', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await PATCH(makeRequest({ chapterIndex: 1 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await PATCH(makeRequest({ chapterIndex: 1 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('saves progress and updates status to READING', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1', status: 'WANT', chapterCount: 10 } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', chapterIndex: 2, charOffset: 500 } as any)
    const res = await PATCH(makeRequest({ chapterIndex: 2, charOffset: 500 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ chapterIndex: 2, charOffset: 500, status: 'READING' }),
    }))
  })

  it('sets status to FINISHED when chapterIndex is last chapter', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1', status: 'READING', chapterCount: 10 } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1' } as any)
    await PATCH(makeRequest({ chapterIndex: 9, charOffset: 0 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FINISHED' }),
    }))
  })

  it('creates READING_STARTED when status changes to READING', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1', status: 'WANT', chapterCount: 10 } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', chapterIndex: 2, charOffset: 0, status: 'READING' } as any)
    mockActivityCreate.mockResolvedValue({} as any)
    await PATCH(makeRequest({ chapterIndex: 2, charOffset: 0 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockActivityCreate).toHaveBeenCalledWith({
      data: { userId: 'user1', actionType: 'READING_STARTED', bookId: 'book1' },
    })
  })

  it('creates BOOK_FINISHED when status changes to FINISHED', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1', status: 'READING', chapterCount: 10 } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', chapterIndex: 9, charOffset: 0, status: 'FINISHED' } as any)
    mockActivityCreate.mockResolvedValue({} as any)
    await PATCH(makeRequest({ chapterIndex: 9, charOffset: 0 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockActivityCreate).toHaveBeenCalledWith({
      data: { userId: 'user1', actionType: 'BOOK_FINISHED', bookId: 'book1' },
    })
  })

  it('does not create activity if status unchanged', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    // Already READING, moving to another READING chapter (not the last)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1', status: 'READING', chapterCount: 10 } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', chapterIndex: 3, charOffset: 0, status: 'READING' } as any)
    mockActivityCreate.mockResolvedValue({} as any)
    await PATCH(makeRequest({ chapterIndex: 3, charOffset: 0 }), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockActivityCreate).not.toHaveBeenCalled()
  })
})
