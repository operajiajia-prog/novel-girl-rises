// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: { book: { findUnique: vi.fn(), update: vi.fn() } },
}))

import { POST, DELETE } from '@/app/api/books/[id]/archive/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.book.findUnique)
const mockUpdate = vi.mocked(db.book.update)

function makeRequest(method: 'POST' | 'DELETE') {
  return new Request('http://localhost/api/books/book1/archive', { method })
}

const params = Promise.resolve({ id: 'book1' })

describe('POST /api/books/[id]/archive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest('POST'), { params })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await POST(makeRequest('POST'), { params })
    expect(res.status).toBe(404)
  })

  it('sets isArchived = true', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', isArchived: true } as any)
    const res = await POST(makeRequest('POST'), { params })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { isArchived: true },
    }))
  })
})

describe('DELETE /api/books/[id]/archive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeRequest('DELETE'), { params })
    expect(res.status).toBe(401)
  })

  it('sets isArchived = false', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'u1' } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'book1', isArchived: false } as any)
    const res = await DELETE(makeRequest('DELETE'), { params })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { isArchived: false },
    }))
  })
})

describe('POST /api/books/[id]/archive — 500', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeRequest('POST'), { params })
    expect(res.status).toBe(500)
  })
})

describe('DELETE /api/books/[id]/archive — extra cases', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await DELETE(makeRequest('DELETE'), { params })
    expect(res.status).toBe(404)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))
    const res = await DELETE(makeRequest('DELETE'), { params })
    expect(res.status).toBe(500)
  })
})
