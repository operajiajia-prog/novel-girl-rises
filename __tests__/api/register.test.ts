import { vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed_password') },
}))

import { POST } from '@/app/api/register/route'
import { db } from '@/lib/db'

const mockFindFirst = vi.mocked(db.user.findFirst)
const mockCreate = vi.mocked(db.user.create)

function makeRequest(body: object) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({ email: 'bad', username: 'user', password: 'password123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for short password', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', username: 'user', password: '123' }))
    expect(res.status).toBe(400)
  })

  it('returns 409 if email already exists', async () => {
    mockFindFirst.mockResolvedValueOnce({ id: '1', email: 'a@b.com', username: 'other' } as any)
    const res = await POST(makeRequest({ email: 'a@b.com', username: 'newuser', password: 'password123' }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('邮箱已被注册')
  })

  it('returns 201 with user on success', async () => {
    mockFindFirst.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce({ id: 'cuid1', email: 'a@b.com', username: 'newuser' } as any)
    const res = await POST(makeRequest({ email: 'a@b.com', username: 'newuser', password: 'password123' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('a@b.com')
  })
})
