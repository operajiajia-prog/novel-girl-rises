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

describe('GET /api/books', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns books for authenticated user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      { id: 'b1', title: '书一', userId: 'user1' } as any,
      { id: 'b2', title: '书二', userId: 'user1' } as any,
    ])
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.books).toHaveLength(2)
  })

  it('only queries current user books', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    await GET(makeRequest())
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user1' }) })
    )
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })
})
