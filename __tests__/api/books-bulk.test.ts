// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PATCH, DELETE } from '@/app/api/books/bulk/route'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({ db: { book: { updateMany: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() } } }))
vi.mock('@/lib/r2', () => ({ deleteFile: vi.fn(), keyFromUrl: vi.fn().mockReturnValue('key') }))

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteFile } from '@/lib/r2'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

function makeRequest(body: object) {
  return new Request('http://localhost/api/books/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/books/bulk', () => {
  it('returns 401 when not logged in', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await PATCH(makeRequest({ bookIds: ['1'], action: 'status', status: 'READING' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when bookIds is empty', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await PATCH(makeRequest({ bookIds: [], action: 'status', status: 'READING' }))
    expect(res.status).toBe(400)
  })

  it('updates status for valid bookIds', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.updateMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ count: 2 })
    const res = await PATCH(makeRequest({ bookIds: ['1', '2'], action: 'status', status: 'FINISHED' }))
    expect(res.status).toBe(200)
    expect(db.book.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['1', '2'] }, userId: 'user1' },
      data: { status: 'FINISHED' },
    })
  })

  it('archives books for action=archive', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.updateMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ count: 1 })
    const res = await PATCH(makeRequest({ bookIds: ['1'], action: 'archive' }))
    expect(res.status).toBe(200)
    expect(db.book.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['1'] }, userId: 'user1' },
      data: { isArchived: true },
    })
  })

  it('returns 400 for invalid status value', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await PATCH(makeRequest({ bookIds: ['1'], action: 'status', status: 'INVALID' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/books/bulk', () => {
  it('returns 401 when not logged in', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await DELETE(makeRequest({ bookIds: ['1'] }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when bookIds is empty', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    const res = await DELETE(makeRequest({ bookIds: [] }))
    expect(res.status).toBe(400)
  })

  it('deletes books and their R2 files', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as any)
    ;(db.book.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: '1', fileUrl: 'https://r2.example.com/file1.txt' },
    ])
    ;(db.book.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ count: 1 })
    const res = await DELETE(makeRequest({ bookIds: ['1'] }))
    expect(res.status).toBe(200)
    expect(deleteFile).toHaveBeenCalled()
    expect(db.book.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['1'] }, userId: 'user1' },
    })
  })
})
