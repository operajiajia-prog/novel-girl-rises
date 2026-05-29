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

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.book.findUnique)
const mockUpdate = vi.mocked(db.book.update)
const mockDelete = vi.mocked(db.book.delete)
const mockDeleteFile = vi.mocked(deleteFile)

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
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await PATCH(makePatchRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await PATCH(makePatchRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for invalid status', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(mockBook as any)
    const res = await PATCH(
      makePatchRequest('book1', { status: 'INVALID' }),
      { params: Promise.resolve({ id: 'book1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('updates status successfully', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(mockBook as any)
    mockUpdate.mockResolvedValueOnce({ ...mockBook, status: 'READING' } as any)
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
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when book not found or not owned', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(null)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(404)
  })

  it('deletes book and returns 200', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(mockBook as any)
    mockDelete.mockResolvedValueOnce(mockBook as any)
    const res = await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('calls deleteFile with correct key', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockFindUnique.mockResolvedValueOnce(mockBook as any)
    mockDelete.mockResolvedValueOnce(mockBook as any)
    await DELETE(makeDeleteRequest(), { params: Promise.resolve({ id: 'book1' }) })
    expect(mockDeleteFile).toHaveBeenCalledWith('books/user1/123_test.txt')
  })
})
