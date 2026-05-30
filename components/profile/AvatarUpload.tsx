'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  username: string
  onUploadSuccess?: () => void
}

export default function AvatarUpload({
  currentAvatarUrl,
  username,
  onUploadSuccess,
}: AvatarUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl)

  function handleClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset the input so the same file can be re-selected if needed
    e.target.value = ''

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json() as { avatarUrl: string }
        setPreviewUrl(data.avatarUrl)
        onUploadSuccess?.()
        router.refresh()
      }
    } finally {
      setIsUploading(false)
    }
  }

  const initial = username[0]?.toUpperCase() ?? '?'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isUploading}
      aria-label="上传头像"
      style={{
        position: 'relative',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid var(--border-default)',
        background: previewUrl ? 'transparent' : 'var(--accent-100)',
        cursor: isUploading ? 'wait' : 'pointer',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {previewUrl ? (
        <Image
          src={previewUrl}
          alt={username}
          width={72}
          height={72}
          style={{ objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--accent-400)',
            userSelect: 'none',
          }}
        >
          {initial}
        </span>
      )}

      {/* Loading overlay */}
      {isUploading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          <div className="avatar-spinner" />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        aria-label="选择文件"
        style={{ display: 'none' }}
        tabIndex={-1}
      />
    </button>
  )
}
