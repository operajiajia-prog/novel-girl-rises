// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn() } },
}))

import { GET, PATCH } from '@/app/api/user/reader-prefs/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.user.findUnique)
const mockUpdate = vi.mocked(db.user.update)

function makeGet() {
  return new Request('http://localhost/api/user/reader-prefs')
}
function makePatch(body: object) {
  return new Request('http://localhost/api/user/reader-prefs', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/user/reader-prefs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await GET(makeGet())
    expect(res.status).toBe(401)
  })

  it('returns current reader preferences', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({
      readerFontSize: 18,
      readerBgColor: 'dark',
      readerLineHeight: 'wide',
    } as any)
    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fontSize).toBe(18)
    expect(body.bgColor).toBe('dark')
    expect(body.lineHeight).toBe('wide')
  })

  it('returns defaults when fields are default values', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockResolvedValueOnce({
      readerFontSize: 17,
      readerBgColor: 'dark',
      readerLineHeight: 'normal',
    } as any)
    const res = await GET(makeGet())
    const body = await res.json()
    expect(body.fontSize).toBe(17)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET(makeGet())
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/user/reader-prefs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as any)
    const res = await PATCH(makePatch({ fontSize: 18 }))
    expect(res.status).toBe(401)
  })

  it('updates fontSize', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockUpdate.mockResolvedValueOnce({ readerFontSize: 20, readerBgColor: 'dark', readerLineHeight: 'normal' } as any)
    const res = await PATCH(makePatch({ fontSize: 20 }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ readerFontSize: 20 }),
    }))
  })

  it('returns 400 when fontSize out of range', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    const res = await PATCH(makePatch({ fontSize: 30 }))
    expect(res.status).toBe(400)
  })

  it('updates bgColor', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockUpdate.mockResolvedValueOnce({ readerFontSize: 17, readerBgColor: 'sepia', readerLineHeight: 'normal' } as any)
    const res = await PATCH(makePatch({ bgColor: 'sepia' }))
    expect(res.status).toBe(200)
  })

  it('updates lineHeight', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockUpdate.mockResolvedValueOnce({ readerFontSize: 17, readerBgColor: 'dark', readerLineHeight: 'wide' } as any)
    const res = await PATCH(makePatch({ lineHeight: 'wide' }))
    expect(res.status).toBe(200)
  })

  it('partial update — only provided fields', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockUpdate.mockResolvedValueOnce({ readerFontSize: 16, readerBgColor: 'dark', readerLineHeight: 'normal' } as any)
    await PATCH(makePatch({ fontSize: 16 }))
    const call = mockUpdate.mock.calls[0][0] as any
    expect(call.data.readerFontSize).toBe(16)
    expect(call.data.readerBgColor).toBeUndefined()
  })

  it('returns 400 for invalid bgColor', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    const res = await PATCH(makePatch({ bgColor: 'rainbow' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid lineHeight', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    const res = await PATCH(makePatch({ lineHeight: 'superwide' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'u1' } } as any)
    mockUpdate.mockRejectedValueOnce(new Error('DB error'))
    const res = await PATCH(makePatch({ fontSize: 18 }))
    expect(res.status).toBe(500)
  })
})
