// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: {
      findUnique: vi.fn(),
    },
    friendship: {
      findFirst: vi.fn(),
    },
    activityFeed: {
      create: vi.fn(),
    },
  },
}))

import { POST } from '@/app/api/books/[id]/recommend/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockBookFindUnique = vi.mocked(db.book.findUnique)
const mockFriendshipFindFirst = vi.mocked(db.friendship.findFirst)
const mockActivityCreate = vi.mocked(db.activityFeed.create)

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/books/book1/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : JSON.stringify({}),
  })
}

describe('POST /api/books/[id]/recommend', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest({ targetUserId: 'user2' }), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1', name: 'alice' } } as any)
    mockBookFindUnique.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ targetUserId: 'user2' }), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 400 when targetUserId is missing', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1', name: 'alice' } } as any)
    mockBookFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1' } as any)
    const res = await POST(makeRequest({}), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('MISSING_TARGET')
  })

  it('returns 400 when targetUserId is same as current user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1', name: 'alice' } } as any)
    mockBookFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1' } as any)
    const res = await POST(makeRequest({ targetUserId: 'user1' }), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('CANNOT_RECOMMEND_SELF')
  })

  it('returns 403 when users are not friends', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1', name: 'alice' } } as any)
    mockBookFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1' } as any)
    mockFriendshipFindFirst.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ targetUserId: 'user2' }), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toBe('NOT_FRIENDS')
  })

  it('creates BOOK_RECOMMENDED activity for target user and returns ok: true', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1', name: 'alice' } } as any)
    mockBookFindUnique.mockResolvedValueOnce({ id: 'book1', userId: 'user1' } as any)
    mockFriendshipFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'ACCEPTED' } as any)
    mockActivityCreate.mockResolvedValueOnce({ id: 'act1' } as any)

    const res = await POST(makeRequest({ targetUserId: 'user2' }), {
      params: Promise.resolve({ id: 'book1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)

    expect(mockActivityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user2',
          actionType: 'BOOK_RECOMMENDED',
          bookId: 'book1',
          metadata: expect.objectContaining({ fromUserId: 'user1' }),
        }),
      })
    )
  })
})
