// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: { book: { create: vi.fn() }, activityFeed: { create: vi.fn().mockResolvedValue({}) } },
}))
vi.mock('@/lib/r2', () => ({
  uploadFile: vi.fn().mockResolvedValue('https://r2.example.com/key'),
  buildKey: vi.fn().mockReturnValue('books/u1/test.txt'),
}))
vi.mock('@/lib/txt-parser', () => ({
  parseTxtFile: vi.fn().mockReturnValue({
    title: '解析书名', author: '作者', encoding: 'UTF-8', chapterCount: 5,
  }),
}))

import { POST } from '@/app/api/books/upload/batch/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockCreate = vi.mocked(db.book.create)

function makeFormData(files: Array<{ name: string }>) {
  const formData = new FormData()
  files.forEach(f => {
    const file = new File(['这是小说内容测试文本'], f.name, { type: 'text/plain' })
    formData.append('files', file)
  })
  return new Request('http://localhost/api/books/upload/batch', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/books/upload/batch', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await POST(makeFormData([]))
    expect(res.status).toBe(401)
  })

  it('returns 400 when no files provided', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    const res = await POST(makeFormData([]))
    expect(res.status).toBe(400)
  })

  it('uploads multiple TXT files, returns succeeded list', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockCreate.mockResolvedValue({ id: 'b1', title: '解析书名' } as any)
    const res = await POST(makeFormData([
      { name: '书一.txt' },
      { name: '书二.txt' },
    ]))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.succeeded).toHaveLength(2)
    expect(body.failed).toHaveLength(0)
  })

  it('handles partial failure: returns both succeeded and failed', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockCreate
      .mockResolvedValueOnce({ id: 'b1', title: '解析书名' } as any)
      .mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeFormData([
      { name: '书一.txt' },
      { name: '书二.txt' },
    ]))
    const body = await res.json()
    expect(body.succeeded).toHaveLength(1)
    expect(body.failed).toHaveLength(1)
  })

  it('failed item includes filename and error message', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockCreate.mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeFormData([{ name: '书一.txt' }]))
    const body = await res.json()
    expect(body.failed[0].filename).toBe('书一.txt')
    expect(body.failed[0].error).toBeTruthy()
  })

  it('each succeeded item includes bookId and title', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockCreate.mockResolvedValueOnce({ id: 'bk1', title: '解析书名' } as any)
    const res = await POST(makeFormData([{ name: '书一.txt' }]))
    const body = await res.json()
    expect(body.succeeded[0].bookId).toBe('bk1')
    expect(body.succeeded[0].title).toBe('解析书名')
  })
})
