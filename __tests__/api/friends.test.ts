// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    friendship: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { GET } from '@/app/api/friends/route'
import { GET as GET_REQUESTS } from '@/app/api/friends/requests/route'
import { POST, PATCH, DELETE } from '@/app/api/friends/[userId]/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindMany = vi.mocked(db.friendship.findMany)
const mockFindFirst = vi.mocked(db.friendship.findFirst)
const mockCreate = vi.mocked(db.friendship.create)
const mockUpdate = vi.mocked(db.friendship.update)
const mockDelete = vi.mocked(db.friendship.delete)
const mockDeleteMany = vi.mocked(db.friendship.deleteMany)
const mockUserFindUnique = vi.mocked(db.user.findUnique)

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/friends/user2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/friends', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns accepted friends list', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      {
        id: 'f1',
        requesterId: 'user1',
        addresseeId: 'user2',
        status: 'ACCEPTED',
        requester: { id: 'user1', username: 'alice', avatarUrl: null },
        addressee: { id: 'user2', username: 'bob', avatarUrl: 'https://example.com/bob.png' },
      } as any,
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.friends).toHaveLength(1)
  })

  it('includes friend\'s username and avatarUrl', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      {
        id: 'f1',
        requesterId: 'user2',
        addresseeId: 'user1',
        status: 'ACCEPTED',
        requester: { id: 'user2', username: 'bob', avatarUrl: 'https://example.com/bob.png' },
        addressee: { id: 'user1', username: 'alice', avatarUrl: null },
      } as any,
    ])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.friends[0].username).toBe('bob')
    expect(body.friends[0].avatarUrl).toBe('https://example.com/bob.png')
  })
})

describe('GET /api/friends/requests', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET_REQUESTS()
    expect(res.status).toBe(401)
  })

  it('returns pending incoming requests only (addressee = me)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValueOnce([
      {
        id: 'f1',
        requesterId: 'user2',
        addresseeId: 'user1',
        status: 'PENDING',
        requester: { id: 'user2', username: 'bob', avatarUrl: null },
      } as any,
    ])
    const res = await GET_REQUESTS()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.requests).toHaveLength(1)
    expect(body.requests[0].requester.username).toBe('bob')
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ addresseeId: 'user1', status: 'PENDING' }),
      })
    )
  })
})

describe('POST /api/friends/[userId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest(), { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when trying to add yourself', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await POST(makeRequest(), { params: Promise.resolve({ userId: 'user1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 404 when target user does not exist', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockUserFindUnique.mockResolvedValueOnce(null)
    const res = await POST(makeRequest(), { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(404)
  })

  it('returns 409 when request already exists', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user2' } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'PENDING' } as any)
    const res = await POST(makeRequest(), { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(409)
  })

  it('creates PENDING friendship and returns 201', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user2' } as any)
    mockFindFirst.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({
      id: 'f1',
      requesterId: 'user1',
      addresseeId: 'user2',
      status: 'PENDING',
    } as any)
    const res = await POST(makeRequest(), { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterId: 'user1',
          addresseeId: 'user2',
          status: 'PENDING',
        }),
      })
    )
  })
})

describe('PATCH /api/friends/[userId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 when requester tries to accept their own request', async () => {
    // user1 sent the request to user2; user1 (requester) tries to accept — should fail
    // query is { requesterId: 'user2', addresseeId: 'user1', status: 'PENDING' } → not found
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 when friendship is already accepted (not PENDING)', async () => {
    // status filter excludes ACCEPTED records → findFirst returns null
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(404)
  })

  it('accepts friendship (status → ACCEPTED)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'PENDING' } as any)
    mockUpdate.mockResolvedValueOnce({ id: 'f1', status: 'ACCEPTED' } as any)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'f1' },
        data: { status: 'ACCEPTED' },
      })
    )
  })

  it('returns 400 for invalid action (not "accept" or "reject")', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'PENDING' } as any)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'block' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(400)
  })

  it('deletes friendship on reject', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'f1', status: 'PENDING' } as any)
    mockDelete.mockResolvedValueOnce({ id: 'f1' } as any)
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'f1' } })
    )
  })
})

describe('DELETE /api/friends/[userId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/friends/user2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when no friendship existed', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockDeleteMany.mockResolvedValueOnce({ count: 0 })
    const req = new Request('http://localhost/api/friends/user2', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(404)
  })

  it('removes accepted friendship', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockDeleteMany.mockResolvedValueOnce({ count: 1 })
    const req = new Request('http://localhost/api/friends/user2', {
      method: 'DELETE',
    })
    const res = await DELETE(req, { params: Promise.resolve({ userId: 'user2' }) })
    expect(res.status).toBe(200)
    expect(mockDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ requesterId: 'user1', addresseeId: 'user2' }),
            expect.objectContaining({ requesterId: 'user2', addresseeId: 'user1' }),
          ]),
        }),
      })
    )
  })
})
