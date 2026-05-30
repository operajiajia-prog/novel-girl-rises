// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findMany: vi.fn(),
    },
  },
}))

import { GET } from '@/app/api/users/search/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(db.user.findMany)

describe('GET /api/users/search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/users/search?q=alice')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns matching users by username', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      { id: 'user2', username: 'alice', avatarUrl: null },
      { id: 'user3', username: 'alice_reads', avatarUrl: 'https://example.com/img.png' },
    ] as any)
    const req = new Request('http://localhost/api/users/search?q=alice')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.users).toHaveLength(2)
    expect(body.users[0].username).toBe('alice')
    expect(body.users[1].username).toBe('alice_reads')
  })

  it('excludes current user from results', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      { id: 'user2', username: 'alice', avatarUrl: null },
    ] as any)
    const req = new Request('http://localhost/api/users/search?q=alice')
    await GET(req)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { id: 'user1' },
        }),
      })
    )
  })

  it('returns empty array for no matches', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([])
    const req = new Request('http://localhost/api/users/search?q=xyz_nobody')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.users).toHaveLength(0)
  })

  it('returns 400 when q param is missing', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const req = new Request('http://localhost/api/users/search')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockRejectedValueOnce(new Error('DB error'))
    const req = new Request('http://localhost/api/users/search?q=alice')
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
