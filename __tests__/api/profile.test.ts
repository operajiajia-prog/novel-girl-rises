// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))
vi.mock('@/lib/r2', () => ({
  uploadFile: vi.fn().mockResolvedValue('https://cdn.example.com/avatars/user1/123.jpg'),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  keyFromUrl: vi.fn().mockReturnValue('avatars/user1/old.jpg'),
}))

import { PATCH } from '@/app/api/profile/route'
import { POST } from '@/app/api/profile/avatar/route'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadFile, deleteFile } from '@/lib/r2'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(db.user.findUnique)
const mockUpdate = vi.mocked(db.user.update)
const mockUploadFile = vi.mocked(uploadFile)
const mockDeleteFile = vi.mocked(deleteFile)

function makeAvatarRequest(filename = 'avatar.jpg', type = 'image/jpeg', size = 1024) {
  const file = new File([new ArrayBuffer(size)], filename, { type })
  const formData = new FormData()
  formData.append('avatar', file)
  return new Request('http://localhost/api/profile/avatar', {
    method: 'POST',
    body: formData,
  })
}

describe('PATCH /api/profile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as unknown as never)
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newname' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid username (too short / invalid chars)', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ab' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)

    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    const req2 = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid name!' }),
    })
    const res2 = await PATCH(req2)
    expect(res2.status).toBe(400)
  })

  it('returns 409 if username taken', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    mockFindUnique.mockResolvedValueOnce({ id: 'user2', username: 'taken' } as unknown as never)
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'taken' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('用户名已被占用')
  })

  it('updates username and bio successfully', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    mockFindUnique.mockResolvedValueOnce(null)
    mockUpdate.mockResolvedValueOnce({ username: 'newname', bio: 'hello' } as unknown as never)
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newname', bio: 'hello' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.username).toBe('newname')
    expect(body.bio).toBe('hello')
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newname' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/profile/avatar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null as unknown as never)
    const res = await POST(makeAvatarRequest())
    expect(res.status).toBe(401)
  })

  it('returns 400 for non-image file', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    const res = await POST(makeAvatarRequest('doc.pdf', 'application/pdf'))
    expect(res.status).toBe(400)
  })

  it('returns 400 for file > 5MB', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    const res = await POST(makeAvatarRequest('avatar.jpg', 'image/jpeg', 6 * 1024 * 1024))
    expect(res.status).toBe(400)
  })

  it('uploads image and returns new avatarUrl', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    mockFindUnique.mockResolvedValueOnce({ avatarUrl: 'https://cdn.example.com/avatars/user1/old.jpg' } as unknown as never)
    mockUpdate.mockResolvedValueOnce({ avatarUrl: 'https://cdn.example.com/avatars/user1/123.jpg' } as unknown as never)
    const res = await POST(makeAvatarRequest('avatar.jpg', 'image/jpeg', 1024))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.avatarUrl).toBe('https://cdn.example.com/avatars/user1/123.jpg')
    expect(mockUploadFile).toHaveBeenCalled()
    expect(mockDeleteFile).toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user1' } } as unknown as never)
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))
    const res = await POST(makeAvatarRequest('avatar.jpg', 'image/jpeg', 1024))
    expect(res.status).toBe(500)
  })
})
