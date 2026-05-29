// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    booklist: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    booklistEntry: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/booklist/route'
import { DELETE } from '@/app/api/booklist/[bookId]/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockBooklistFindUnique = vi.mocked(db.booklist.findUnique)
const mockBooklistUpsert = vi.mocked(db.booklist.upsert)
const mockEntryFindUnique = vi.mocked(db.booklistEntry.findUnique)
const mockEntryCreate = vi.mocked(db.booklistEntry.create)
const mockEntryDelete = vi.mocked(db.booklistEntry.delete)
const mockEntryAggregate = vi.mocked(db.booklistEntry.aggregate)

describe('GET /api/booklist', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("returns user's booklist (creates if not exists)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistUpsert.mockResolvedValueOnce({
      id: 'bl1',
      userId: 'user1',
      title: '我的精选',
      isPublic: true,
      updatedAt: new Date(),
      entries: [],
    } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.booklist).toBeDefined()
    expect(body.booklist.userId).toBe('user1')
    expect(mockBooklistUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user1' },
        create: expect.objectContaining({ userId: 'user1' }),
        update: {},
      })
    )
  })

  it('includes book details in entries', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistUpsert.mockResolvedValueOnce({
      id: 'bl1',
      userId: 'user1',
      title: '我的精选',
      isPublic: true,
      updatedAt: new Date(),
      entries: [
        {
          id: 'e1',
          booklistId: 'bl1',
          bookId: 'b1',
          order: 0,
          book: { id: 'b1', title: '测试书', coverUrl: null, author: '作者' },
        },
      ],
    } as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.booklist.entries).toHaveLength(1)
    expect(body.booklist.entries[0].book.title).toBe('测试书')
  })
})

describe('POST /api/booklist', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/booklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'b1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('adds book to booklist', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistUpsert.mockResolvedValueOnce({
      id: 'bl1',
      userId: 'user1',
      title: '我的精选',
      isPublic: true,
      updatedAt: new Date(),
      entries: [],
    } as any)
    mockEntryFindUnique.mockResolvedValueOnce(null)
    mockEntryAggregate.mockResolvedValueOnce({ _max: { order: null } } as any)
    mockEntryCreate.mockResolvedValueOnce({
      id: 'e1',
      booklistId: 'bl1',
      bookId: 'b1',
      order: 0,
    } as any)
    const req = new Request('http://localhost/api/booklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'b1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.entry).toBeDefined()
    expect(mockEntryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          booklistId: 'bl1',
          bookId: 'b1',
          order: 0,
        }),
      })
    )
  })

  it('returns 409 if book already in booklist', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistUpsert.mockResolvedValueOnce({
      id: 'bl1',
      userId: 'user1',
      title: '我的精选',
      isPublic: true,
      updatedAt: new Date(),
      entries: [],
    } as any)
    mockEntryFindUnique.mockResolvedValueOnce({
      id: 'e1',
      booklistId: 'bl1',
      bookId: 'b1',
      order: 0,
    } as any)
    const req = new Request('http://localhost/api/booklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId: 'b1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/booklist/[bookId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const req = new Request('http://localhost/api/booklist/b1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ bookId: 'b1' }) })
    expect(res.status).toBe(401)
  })

  it('removes book from booklist', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistFindUnique.mockResolvedValueOnce({ id: 'bl1', userId: 'user1' } as any)
    mockEntryFindUnique.mockResolvedValueOnce({
      id: 'e1',
      booklistId: 'bl1',
      bookId: 'b1',
      order: 0,
    } as any)
    mockEntryDelete.mockResolvedValueOnce({ id: 'e1' } as any)
    const req = new Request('http://localhost/api/booklist/b1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ bookId: 'b1' }) })
    expect(res.status).toBe(200)
    expect(mockEntryDelete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'e1' } })
    )
  })

  it('returns 404 if not in list', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockBooklistFindUnique.mockResolvedValueOnce({ id: 'bl1', userId: 'user1' } as any)
    mockEntryFindUnique.mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/booklist/b1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ bookId: 'b1' }) })
    expect(res.status).toBe(404)
  })
})
