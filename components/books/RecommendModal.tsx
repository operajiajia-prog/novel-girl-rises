'use client'

import { useState, useEffect } from 'react'

interface Friend {
  id: string
  username: string
  avatarUrl?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  bookId: string
  bookTitle: string
}

export default function RecommendModal({ open, onClose, bookId, bookTitle }: Props) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)
  const [recommended, setRecommended] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setRecommended(new Set())
    setErrors({})
    fetch('/api/friends')
      .then((r) => r.json())
      .then((data) => setFriends(data.friends ?? []))
      .catch(() => setFriends([]))
      .finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const handleRecommend = async (friend: Friend) => {
    try {
      const res = await fetch(`/api/books/${bookId}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: friend.id }),
      })
      if (res.ok) {
        setRecommended((prev) => new Set([...prev, friend.id]))
        setErrors((prev) => {
          const next = { ...prev }
          delete next[friend.id]
          return next
        })
      } else {
        const data = await res.json().catch(() => ({}))
        setErrors((prev) => ({
          ...prev,
          [friend.id]: data.error ?? '推荐失败，请重试',
        }))
      }
    } catch {
      setErrors((prev) => ({ ...prev, [friend.id]: '网络错误，请重试' }))
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-label="关闭"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 50,
        }}
      />
      {/* Modal card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(400px, calc(100vw - 32px))',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          padding: '24px',
          zIndex: 51,
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            推荐给好友
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {bookTitle}
        </p>

        {/* Friends list */}
        {loading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                aria-label="加载中"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-elevated)',
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    height: '14px',
                    width: '80px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                  }}
                />
              </div>
            ))}
          </>
        ) : friends.length === 0 ? (
          <p
            style={{
              margin: '24px 0',
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            还没有好友，先去添加好友吧
          </p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id}>
              <button
                type="button"
                onClick={() => !recommended.has(friend.id) && handleRecommend(friend)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: recommended.has(friend.id) ? 'default' : 'pointer',
                  textAlign: 'left',
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
                    background: friend.avatarUrl ? 'transparent' : 'var(--accent-100)',
                    position: 'relative',
                  }}
                >
                  {friend.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={friend.avatarUrl}
                      alt={friend.username}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--accent-400)',
                        userSelect: 'none',
                      }}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Username */}
                <span
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  {friend.username}
                </span>

                {/* Status */}
                {recommended.has(friend.id) && (
                  <span style={{ fontSize: '16px', color: 'var(--accent-500)' }}>✓</span>
                )}
              </button>
              {errors[friend.id] && (
                <p
                  style={{
                    margin: '2px 0 6px',
                    fontSize: '12px',
                    color: 'var(--color-error, #f87171)',
                  }}
                >
                  {errors[friend.id]}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </>
  )
}
