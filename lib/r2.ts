import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'
import path from 'path'

// 本地开发模式：R2 未配置时把文件存到 public/uploads/
const USE_LOCAL = !process.env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID === '""' || process.env.R2_ACCOUNT_ID.trim() === ''
const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads')
const LOCAL_BASE_URL = '/uploads'

const client = USE_LOCAL ? null : new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.R2_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_PUBLIC_URL || LOCAL_BASE_URL

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (USE_LOCAL) {
    const filePath = path.join(LOCAL_DIR, key)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, body)
    return `${LOCAL_BASE_URL}/${key}`
  }
  await client!.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
  return `${PUBLIC_URL}/${key}`
}

export async function deleteFile(key: string): Promise<void> {
  if (USE_LOCAL) {
    const filePath = path.join(LOCAL_DIR, key)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return
  }
  await client!.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  if (USE_LOCAL) return `${LOCAL_BASE_URL}/${key}`
  return getSignedUrl(client!, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}

export function keyFromUrl(url: string): string {
  if (url.startsWith(LOCAL_BASE_URL + '/')) return url.slice(LOCAL_BASE_URL.length + 1)
  return url.replace(`${PUBLIC_URL}/`, '')
}

export function buildKey(userId: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9.\-_一-龥]/g, '_')
  return `books/${userId}/${Date.now()}_${sanitized}`
}

export async function downloadFile(key: string): Promise<Buffer> {
  if (USE_LOCAL) {
    const filePath = path.join(LOCAL_DIR, key)
    return fs.readFileSync(filePath)
  }
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const response = await client!.send(command)
  if (!response.Body) throw new Error(`No body returned for key: ${key}`)
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}
