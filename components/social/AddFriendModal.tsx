'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface SearchUser {
  id: string
  username: string
  avatarUrl?: string | null
}

interface AddFriendModalProps {
  onClose: () => void
}

type RequestState = 'idle' | 'sent' | 'error'

export default function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])
  const [requestStates, setRequestStates] = useState<Record<string, RequestState>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.users ?? [])
        }
      } catch {
        // silently fail
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function sendRequest(userId: string) {
    setRequestStates((prev) => ({ ...prev, [userId]: 'idle' }))
    try {
      const res = await fetch(`/api/friends/${userId}`, { method: 'POST' })
      if (res.ok) {
        setRequestStates((prev) => ({ ...prev, [userId]: 'sent' }))
      } else {
        setRequestStates((prev) => ({ ...prev, [userId]: 'error' }))
      }
    } catch {
      setRequestStates((prev) => ({ ...prev, [userId]: 'error' }))
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-default)',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          margin: '0 16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            添加好友
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <input
          type="text"
          placeholder="搜索用户名"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="搜索用户"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map((user) => {
              const state = requestStates[user.id]
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: user.avatarUrl ? 'transparent' : 'var(--accent-100)',
                      position: 'relative',
                    }}
                  >
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        width={36}
                        height={36}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-400)' }}>
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Username */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user.username}
                  </span>

                  {/* Send button */}
                  {state === 'sent' ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>已发送</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendRequest(user.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--accent-500)',
                        color: 'var(--color-primary-foreground)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-600)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-500)'
                      }}
                    >
                      发送请求
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
