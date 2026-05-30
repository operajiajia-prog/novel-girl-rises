// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    book: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityFeed: {
      create: vi.fn(),
    },
  },
}))
vi.mock('@/lib/r2', () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
  keyFromUrl: vi.fn().mockReturnValue('books/user1/123_test.txt'),
}))

import { PATCH, DELETE } from '@/app/api/books/[id]/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile } from '@/lib/r2'
import type { Book } from '@prisma/client'

// Narrow session type used in route handlers (auth() called with no args)
type AuthSession = { user: { id: string; email?: string | null; name?: string | null } } | null

// vi.mocked resolves to NextMiddleware due to overload order; cast to the relevant no-args overload
const mockAuth = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn<() => Promise<AuthSession>>>
const mockFindUnique = vi.mocked(db.book.findUnique)
const mockUpdate = vi.mocked(db.book.update)
const mockDelete = vi.mocked(db.book.delete)
const mockDeleteFile = vi.mocked(deleteFile)
const mockCreateActivity = vi.mocked(db.activityFeed.create)

function makePatchRequest(bookId = 'book1', body: Record<string, unknown> = { status: 'READING' }) {
  return new Request(`http://localhost/api/books/${bookId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(bookId = 'book1') {
  return new Request(`http://localhost/api/books/${bookId}`, {
    method: 'DELETE',
  })
}

const mockBook = {
  id: 'book1',
  title: '测试书',
  author: '作者',
  fileUrl: 'https://cdn.example.com/books/user1/123_test.txt',
  userId: 'user1',
  status: 'WANT',
}

describe('PATCH /api/books/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // activityFeed.create is fire-and-forget; provide a default resolved value
    // so the returned promise has a .catch() method even when the test doesn't
    // explicitly mock it
    mockCreateActivity.mockResolvedValue({} as any)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as unknown as AuthSession)
    const res = await PATCH(makePatchRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await PATCH(makePatchRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(mockBook as unknown as Book)
    const res = await PATCH(
      makePatchRequest('book1', { status: 'INVALID' }),
      { params: Promise.resolve({ id: 'book1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('updates status successfully', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(mockBook as unknown as Book)
    mockUpdate.mockResolvedValueOnce({ ...mockBook, status: 'READING' } as unknown as Book)
    const res = await PATCH(
      makePatchRequest('book1', { status: 'READING' }),
      { params: Promise.resolve({ id: 'book1' }) }
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('READING')
  })
})

describe('DELETE /api/books/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as unknown as AuthSession)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('deletes book and returns 200', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(mockBook as unknown as Book)
    mockDelete.mockResolvedValueOnce(mockBook as unknown as Book)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('calls deleteFile with correct key', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce(mockBook as unknown as Book)
    mockDelete.mockResolvedValueOnce(mockBook as unknown as Book)
    await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockDeleteFile).toHaveBeenCalledWith('books/user1/123_test.txt')
  })
})

describe('activity feed on status change', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates READING_STARTED activity when status changes to READING', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce({ id: 'b1', userId: 'u1', status: 'WANT' } as unknown as Book)
    mockUpdate.mockResolvedValueOnce({ id: 'b1', status: 'READING' } as unknown as Book)
    mockCreateActivity.mockResolvedValueOnce({} as any)

    const res = await PATCH(makePatchRequest('b1', { status: 'READING' }), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    // Give the fire-and-forget a tick to run
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actionType: 'READING_STARTED' }) })
    )
  })

  it('creates BOOK_FINISHED activity when status changes to FINISHED', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce({ id: 'b1', userId: 'u1', status: 'READING' } as unknown as Book)
    mockUpdate.mockResolvedValueOnce({ id: 'b1', status: 'FINISHED' } as unknown as Book)
    mockCreateActivity.mockResolvedValueOnce({} as any)

    const res = await PATCH(makePatchRequest('b1', { status: 'FINISHED' }), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockCreateActivity).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actionType: 'BOOK_FINISHED' }) })
    )
  })

  it('does not create activity when status changes to WANT', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce({ id: 'b1', userId: 'u1', status: 'READING' } as unknown as Book)
    mockUpdate.mockResolvedValueOnce({ id: 'b1', status: 'WANT' } as unknown as Book)

    const res = await PATCH(makePatchRequest('b1', { status: 'WANT' }), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockCreateActivity).not.toHaveBeenCalled()
  })

  it('activity failure does not affect PATCH response', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as unknown as AuthSession)
    mockFindUnique.mockResolvedValueOnce({ id: 'b1', userId: 'u1', status: 'WANT' } as unknown as Book)
    mockUpdate.mockResolvedValueOnce({ id: 'b1', status: 'READING' } as unknown as Book)
    mockCreateActivity.mockRejectedValueOnce(new Error('DB error'))

    const res = await PATCH(makePatchRequest('b1', { status: 'READING' }), { params: Promise.resolve({ id: 'b1' }) })
    expect(res.status).toBe(200)
    // Allow the rejected promise to settle without crashing
    await new Promise(resolve => setTimeout(resolve, 0))
  })
})
