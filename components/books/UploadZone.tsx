'use client'

import { useRef, useState } from 'react'

type UploadZoneProps = {
  onSuccess: (book: { id: string; title: string }) => void
}

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/books/upload', { method: 'POST', body: formData })
      const body = await res.json()
      if (res.ok) {
        onSuccess(body.book)
      } else {
        setError(body.error ?? '上传失败')
      }
    } catch {
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
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
          cursor: uploading ? 'not-allowed' : 'pointer',
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
          {uploading ? '正在上传…' : '点击或拖拽上传小说文件'}
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
    </div>
  )
}
