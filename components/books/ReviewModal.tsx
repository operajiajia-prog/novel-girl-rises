'use client'

import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  bookId: string
  bookTitle: string
  initialText: string | null
  onSaved: (text: string) => void
  onDeleted: () => void
}

const MAX_CHARS = 200

export default function ReviewModal({ open, onClose, bookId, bookTitle, initialText, onSaved, onDeleted }: Props) {
  const [text, setText] = useState(initialText ?? '')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const overLimit = text.length > MAX_CHARS

  const handleSave = async () => {
    if (overLimit || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusText: text }),
      })
      if (res.ok) {
        onSaved(text)
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定删除这条书评？')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${bookId}/notes`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted()
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
      />
      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(480px, calc(100vw - 32px))',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '24px',
          zIndex: 41,
        }}
      >
        <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          写书评
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {bookTitle}
        </p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="读完后有什么感受？"
          rows={5}
          style={{
            width: '100%',
            resize: 'none',
            padding: '12px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: 1.6,
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: overLimit ? 'var(--color-error, #f87171)' : 'var(--text-muted)' }}>
            {text.length}/{MAX_CHARS}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            取消
          </button>

          {initialText && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: 'none',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              删除书评
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={overLimit || saving}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: overLimit || saving ? 'var(--bg-elevated)' : 'var(--accent-500)',
              color: overLimit || saving ? 'var(--text-disabled)' : 'white',
              cursor: overLimit || saving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </>
  )
}
