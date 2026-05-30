'use client'

import { useRef, useState } from 'react'

type UploadZoneProps = {
  onSuccess: (book: { id: string; title: string }) => void
}

type UploadStatus = 'idle' | 'uploading' | 'duplicate'

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{ title: string; existingId: string } | null>(null)

  async function uploadFile(file: File) {
    setStatus('uploading')
    setError(null)
    lastFileRef.current = file
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/books/upload', { method: 'POST', body: formData })
      if (res.status === 409) {
        const body = await res.json()
        setDuplicateInfo({ title: body.title, existingId: body.existingId })
        setStatus('duplicate')
        return
      }
      const body = await res.json()
      if (res.ok) {
        onSuccess(body.book)
        setStatus('idle')
      } else {
        setError(body.error ?? '上传失败')
        setStatus('idle')
      }
    } catch {
      setError('上传失败，请重试')
      setStatus('idle')
    }
  }

  async function forceUpload(file: File) {
    setStatus('uploading')
    setDuplicateInfo(null)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/books/upload?force=true', { method: 'POST', body: formData })
    const body = await res.json()
    if (res.ok) {
      onSuccess(body.book)
      setStatus('idle')
    } else {
      setError(body.error ?? '上传失败')
      setStatus('idle')
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.txt')) {
      setError('仅支持 .txt 文件')
      return
    }
    setError(null)
    uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.txt')) {
      setError('仅支持 .txt 文件')
      return
    }
    setError(null)
    uploadFile(file)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        aria-label="上传 TXT 小说"
        style={{
          border: `2px dashed ${isDragOver ? 'var(--accent-500)' : 'var(--border-default)'}`,
          borderRadius: '12px',
          background: isDragOver ? 'var(--accent-100)' : 'transparent',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
          transition: 'border-color 150ms ease, background 150ms ease',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '6px',
          }}
        >
          {status === 'uploading' ? '正在上传…' : '点击或拖拽上传小说文件'}
        </p>
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          仅支持纯文本小说文件
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".txt"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && (
        <p
          style={{
            marginTop: '8px',
            fontSize: '13px',
            color: 'var(--destructive)',
          }}
        >
          {error}
        </p>
      )}

      {status === 'duplicate' && duplicateInfo && (
        <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
            书库里已有《{duplicateInfo.title}》
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={`/library/${duplicateInfo.existingId}`}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--accent-500)', color: 'var(--bg-base)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
            >
              查看已有书籍
            </a>
            <button
              type="button"
              onClick={() => {
                if (lastFileRef.current) forceUpload(lastFileRef.current)
              }}
              style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}
            >
              仍要上传副本
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
