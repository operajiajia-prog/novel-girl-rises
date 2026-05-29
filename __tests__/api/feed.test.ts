// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    friendship: {
      findMany: vi.fn(),
    },
    activityFeed: {
      findMany: vi.fn(),
    },
  },
}))

import { GET } from '@/app/api/feed/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFriendshipFindMany = vi.mocked(db.friendship.findMany)
const mockActivityFindMany = vi.mocked(db.activityFeed.findMany)

describe('GET /api/feed', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/feed')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns empty array when no friends', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFriendshipFindMany.mockResolvedValueOnce([])
    const req = new Request('http://localhost/api/feed')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toEqual([])
    expect(body.nextCursor).toBeNull()
  })

  it("returns friends' activities in desc order", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFriendshipFindMany.mockResolvedValueOnce([
      { id: 'f1', requesterId: 'user1', addresseeId: 'user2', status: 'ACCEPTED' } as any,
      { id: 'f2', requesterId: 'user3', addresseeId: 'user1', status: 'ACCEPTED' } as any,
    ])
    const now = new Date('2024-01-02T00:00:00Z')
    const earlier = new Date('2024-01-01T00:00:00Z')
    mockActivityFindMany.mockResolvedValueOnce([
      {
        id: 'a1',
        userId: 'user2',
        actionType: 'BOOK_ADDED',
        bookId: 'b1',
        metadata: null,
        createdAt: now,
        user: { username: 'bob', avatarUrl: null },
        book: { id: 'b1', title: '书一', coverUrl: null },
      } as any,
      {
        id: 'a2',
        userId: 'user3',
        actionType: 'READING_STARTED',
        bookId: null,
        metadata: null,
        createdAt: earlier,
        user: { username: 'carol', avatarUrl: null },
        book: null,
      } as any,
    ])
    const req = new Request('http://localhost/api/feed')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(2)
    expect(body.items[0].id).toBe('a1')
    expect(body.items[1].id).toBe('a2')
    // Verify query was called with friend IDs
    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: expect.arrayContaining(['user2', 'user3']) },
        }),
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    )
  })

  it('excludes own activities from feed', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFriendshipFindMany.mockResolvedValueOnce([
      { id: 'f1', requesterId: 'user1', addresseeId: 'user2', status: 'ACCEPTED' } as any,
    ])
    mockActivityFindMany.mockResolvedValueOnce([])
    const req = new Request('http://localhost/api/feed')
    await GET(req)
    // The userId in query should only include user2, NOT user1
    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: { in: ['user2'] },
        }),
      })
    )
  })

  it('respects cursor pagination', async () => {
    const cursor = '2024-01-01T12:00:00.000Z'
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFriendshipFindMany.mockResolvedValueOnce([
      { id: 'f1', requesterId: 'user1', addresseeId: 'user2', status: 'ACCEPTED' } as any,
    ])
    mockActivityFindMany.mockResolvedValueOnce([])
    const req = new Request(`http://localhost/api/feed?cursor=${encodeURIComponent(cursor)}`)
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockActivityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date(cursor) },
        }),
      })
    )
  })
})
