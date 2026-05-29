import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { uploadFile, deleteFile, keyFromUrl } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    return NextResponse.json({ error: '未提供文件' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '不支持的图片格式' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '图片超过 5MB 限制' }, { status: 400 })
  }

  const ext = EXT_MAP[file.type]
  const key = `avatars/${session.user.id}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const newUrl = await uploadFile(key, buffer, file.type)

  const existing = await db.user.findUnique({
    where: { id: session.user.id },
    select: { avatarUrl: true },
  })

  if (existing?.avatarUrl) {
    await deleteFile(keyFromUrl(existing.avatarUrl))
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: newUrl },
    select: { avatarUrl: true },
  })

  return NextResponse.json(updated)
}
