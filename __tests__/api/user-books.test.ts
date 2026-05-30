// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    friendship: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    book: { findMany: vi.fn() },
  },
}))

import { GET } from '@/app/api/users/[userId]/books/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindFirst = vi.mocked(db.friendship.findFirst)
const mockUserFindUnique = vi.mocked(db.user.findUnique)
const mockBookFindMany = vi.mocked(db.book.findMany)

function makeRequest() {
  return new Request('http://localhost/api/users/user2/books')
}
const params = Promise.resolve({ userId: 'user2' })

describe('GET /api/users/[userId]/books', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeRequest(), { params })
    expect(res.status).toBe(401)
  })

  it('returns 403 when not friends with target user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce(null)
    const res = await GET(makeRequest(), { params })
    expect(res.status).toBe(403)
  })

  it('returns target user books (isArchived=false only)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'ACCEPTED' } as any)
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user2', username: 'Bob', avatarUrl: null } as any)
    mockBookFindMany.mockResolvedValueOnce([
      { id: 'b1', title: '书一', userId: 'user2' } as any,
    ])
    const res = await GET(makeRequest(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.books).toHaveLength(1)
    expect(body.user.username).toBe('Bob')
    expect(mockBookFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) })
    )
  })

  it('returns 404 when target user does not exist', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'ACCEPTED' } as any)
    mockUserFindUnique.mockResolvedValueOnce(null)
    const res = await GET(makeRequest(), { params })
    expect(res.status).toBe(404)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(makeRequest(), { params })
    expect(res.status).toBe(500)
  })
})
