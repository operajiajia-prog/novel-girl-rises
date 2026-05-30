// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: { book: { findMany: vi.fn() } },
}))

import { GET } from '@/app/api/books/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(db.book.findMany)

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/books')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

const sampleBooks = [
  { id: 'b1', title: '甲', userId: 'u1', updatedAt: new Date('2024-01-03'), createdAt: new Date('2024-01-01'), chapterIndex: 5, chapterCount: 10, isArchived: false, status: 'READING' },
  { id: 'b2', title: '乙', userId: 'u1', updatedAt: new Date('2024-01-01'), createdAt: new Date('2024-01-03'), chapterIndex: 2, chapterCount: 20, isArchived: false, status: 'WANT' },
  { id: 'b3', title: '丙', userId: 'u1', updatedAt: new Date('2024-01-02'), createdAt: new Date('2024-01-02'), chapterIndex: 10, chapterCount: 10, isArchived: true, status: 'FINISHED' },
]

describe('GET /api/books — sort & filter', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('excludes archived books by default', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest())
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) })
    )
  })

  it('includes only archived books when ?archived=true', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest({ archived: 'true' }))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isArchived: true }) })
    )
  })

  it('sorts by updatedAt desc by default (recent)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest())
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'desc' } })
    )
  })

  it('sorts by title asc when ?sort=title', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest({ sort: 'title' }))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'asc' } })
    )
  })

  it('sorts by createdAt desc when ?sort=added', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest({ sort: 'added' }))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
  })

  it('sorts by progress desc when ?sort=progress (in memory)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce(sampleBooks.filter(b => !b.isArchived) as any)
    const res = await GET(makeRequest({ sort: 'progress' }))
    const body = await res.json()
    // b1: 5/10=50%, b2: 2/20=10% → b1 first
    expect(body.books[0].id).toBe('b1')
    expect(body.books[1].id).toBe('b2')
  })

  it('filters by status=READING', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest({ status: 'READING' }))
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'READING' }) })
    )
  })

  it('ignores invalid status values', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest({ status: 'INVALID' }))
    const call = mockFindMany.mock.calls[0][0] as any
    expect(call.where.status).toBeUndefined()
  })
})

describe('GET /api/books — 500 error', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindMany.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
