import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const schema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[\w一-龥]+$/),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '输入无效' }, { status: 400 })
  }

  const { email, username, password } = parsed.data

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: existing.email === email ? '邮箱已被注册' : '用户名已被使用' },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: { email, username, passwordHash },
    select: { id: true, email: true, username: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
