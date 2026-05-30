'use client'

import { useState, useCallback } from 'react'

interface BookEditModalProps {
  book: {
    id: string
    title: string
    author?: string | null
    synopsis?: string | null
    tags?: string[]
    userNotes?: string | null
    coverUrl?: string | null
  }
  onSave: () => void
  onClose: () => void
}

export default function BookEditModal({ book, onSave, onClose }: BookEditModalProps) {
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author ?? '')
  const [synopsis, setSynopsis] = useState(book.synopsis ?? '')
  const [userNotes, setUserNotes] = useState(book.userNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author: author || null, synopsis: synopsis || null, userNotes: userNotes || null }),
      })
      if (res.ok) onSave()
    } finally {
      setSaving(false)
    }
  }, [book.id, title, author, synopsis, userNotes, onSave])

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid var(--border-subtle)',
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        role="dialog"
        aria-label="编辑书籍"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 201,
          background: 'var(--bg-elevated)',
          borderRadius: '20px',
          padding: '24px 20px',
          width: 'min(440px, calc(100vw - 32px))',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
          编辑书籍信息
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>书名</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
              placeholder="书名"
            />
          </div>

          <div>
            <label style={labelStyle}>作者</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              style={inputStyle}
              placeholder="作者（可选）"
            />
          </div>

          <div>
            <label style={labelStyle}>简介</label>
            <textarea
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="简介（可选）"
            />
          </div>

          <div>
            <label style={labelStyle}>我的备注</label>
            <textarea
              value={userNotes}
              onChange={e => setUserNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="私人备注（可选）"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: '1.5px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || saving}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: !title.trim() || saving ? 'var(--bg-elevated)' : 'var(--accent-500)',
              color: !title.trim() || saving ? 'var(--text-disabled)' : 'var(--color-primary-foreground)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: !title.trim() || saving ? 'default' : 'pointer',
            }}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </>
  )
}
