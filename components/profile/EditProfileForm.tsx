'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const BIO_MAX_LENGTH = 140

interface EditProfileFormProps {
  initialUsername: string
  initialBio: string | null
  onSave?: () => void
}

export default function EditProfileForm({
  initialUsername,
  initialBio,
  onSave,
}: EditProfileFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bioLength = useMemo(() => bio.length, [bio])

  function validate(): string | null {
    if (!USERNAME_REGEX.test(username)) {
      return '用户名格式不正确（3-20位字母/数字/下划线）'
    }
    if (bio.length > BIO_MAX_LENGTH) {
      return `简介不能超过 ${BIO_MAX_LENGTH} 个字符`
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio: bio || null }),
      })

      if (res.status === 409) {
        setError('用户名已被占用')
        return
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? '保存失败，请重试')
        return
      }

      onSave?.()
      router.refresh()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Username */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          htmlFor="edit-username"
          style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}
        >
          用户名
        </label>
        <input
          id="edit-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '15px',
            outline: 'none',
            width: '100%',
          }}
          autoComplete="username"
        />
      </div>

      {/* Bio */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            htmlFor="edit-bio"
            style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            简介
          </label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {bioLength}/{BIO_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={BIO_MAX_LENGTH}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '15px',
            outline: 'none',
            width: '100%',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
          placeholder="介绍一下自己…"
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: '13px', color: 'var(--color-danger)', margin: 0 }}>
          {error}
        </p>
      )}

      {/* Save button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          background: isSubmitting ? 'var(--bg-elevated)' : 'var(--accent-500)',
          color: isSubmitting ? 'var(--text-muted)' : 'oklch(0.99 0 0)',
          border: 'none',
          borderRadius: '10px',
          padding: '12px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'background 200ms',
        }}
      >
        {isSubmitting ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
