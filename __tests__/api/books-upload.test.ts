// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { book: { create: vi.fn(), findFirst: vi.fn() }, activityFeed: { create: vi.fn() } } }))
vi.mock('@/lib/r2', () => ({
  uploadFile: vi.fn().mockResolvedValue('https://cdn.example.com/file.txt'),
  buildKey: vi.fn().mockReturnValue('books/user1/123_test.txt'),
}))
vi.mock('@/lib/txt-parser', () => ({
  parseTxtFile: vi.fn().mockReturnValue({
    title: '测试书',
    author: '作者',
    encoding: 'UTF-8',
    chapterCount: 5,
    chapters: [],
    fullText: '内容',
  }),
}))

import { POST } from '@/app/api/books/upload/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockCreate = vi.mocked(db.book.create)
const mockActivityCreate = vi.mocked(db.activityFeed.create)
const mockFindFirst = vi.mocked(db.book.findFirst)

function makeRequest(filename = 'test.txt', size = 1024) {
  const file = new File([new ArrayBuffer(size)], filename, { type: 'text/plain' })
  const formData = new FormData()
  formData.append('file', file)
  return new Request('http://localhost/api/books/upload', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/books/upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns 400 for non-txt file', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await POST(makeRequest('book.pdf'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for file too large', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await POST(makeRequest('book.txt', 51 * 1024 * 1024))
    expect(res.status).toBe(400)
  })

  it('returns 201 with book on success', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValueOnce({
      id: 'book1', title: '测试书', author: '作者',
      fileUrl: 'https://cdn.example.com/file.txt', userId: 'user1',
    } as any)
    const res = await POST(makeRequest('测试书.txt'))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.book.id).toBe('book1')
  })

  it('creates ActivityFeed BOOK_ADDED entry after upload', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValueOnce({
      id: 'book1', title: '测试书', author: '作者',
      fileUrl: 'https://cdn.example.com/file.txt', userId: 'user1',
    } as any)
    mockActivityCreate.mockResolvedValueOnce({} as any)
    await POST(makeRequest('测试书.txt'))
    expect(mockActivityCreate).toHaveBeenCalledWith({
      data: { userId: 'user1', actionType: 'BOOK_ADDED', bookId: 'book1' },
    })
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    mockCreate.mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeRequest('test.txt'))
    expect(res.status).toBe(500)
  })
})

describe('duplicate detection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 when book with same title already exists for user', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'existing-book-id', title: '测试书' } as any)

    const res = await POST(makeRequest('test.txt'))
    expect(res.status).toBe(409)
  })

  it('returns 409 body with existingId and title', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindFirst.mockResolvedValueOnce({ id: 'existing-book-id', title: '测试书' } as any)

    const res = await POST(makeRequest('test.txt'))
    const body = await res.json()
    expect(body.error).toBe('DUPLICATE')
    expect(body.existingId).toBe('existing-book-id')
    expect(body.title).toBe('测试书')
  })

  it('allows upload when ?force=true even if duplicate exists', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    // Note: findFirst is NOT called when force=true, so no need to mock it
    mockCreate.mockResolvedValueOnce({
      id: 'new-book-id', title: '测试书', author: '作者',
      fileUrl: 'https://cdn.example.com/file.txt', userId: 'u1',
    } as any)

    const file = new File([new ArrayBuffer(1024)], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)
    const req = new Request('http://localhost/api/books/upload?force=true', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.book.id).toBe('new-book-id')
  })

  it('allows same title for different users', async () => {
    // user u2 uploading — findFirst returns null (no match for u2)
    mockAuth.mockResolvedValueOnce({ user: { id: 'u2' } } as any)
    mockFindFirst.mockResolvedValueOnce(null as any)
    mockCreate.mockResolvedValueOnce({
      id: 'u2-book-id', title: '测试书', author: '作者',
      fileUrl: 'https://cdn.example.com/file.txt', userId: 'u2',
    } as any)

    const res = await POST(makeRequest('test.txt'))
    expect(res.status).toBe(201)
    // Confirm findFirst was called with u2's userId
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u2' }) })
    )
  })
})