'use client'

import { useState, useEffect, useCallback } from 'react'

interface AnnotationItem {
  id: string
  chapterIndex: number
  content: string
  createdAt: string
  updatedAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  bookId: string
  currentChapterIndex: number
  chapterTitles: string[]
  onJump: (chapterIndex: number) => void
}

export default function AnnotationPanel({
  open,
  onClose,
  bookId,
  currentChapterIndex,
  chapterTitles,
  onJump,
}: Props) {
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addContent, setAddContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const fetchAnnotations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/books/${bookId}/annotations`)
      if (res.ok) {
        const data = await res.json()
        setAnnotations(data.annotations ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    if (open) {
      fetchAnnotations()
    }
  }, [open, fetchAnnotations])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleAdd = async () => {
    if (!addContent.trim() || addContent.length > 500) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${bookId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterIndex: currentChapterIndex, content: addContent }),
      })
      if (res.ok) {
        setAddContent('')
        setShowAddForm(false)
        await fetchAnnotations()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (annotationId: string) => {
    if (!editContent.trim() || editContent.length > 500) return
    setSaving(true)
    try {
      const res = await fetch(`/api/books/${bookId}/annotations?annotationId=${annotationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })
      if (res.ok) {
        setEditingId(null)
        setEditContent('')
        await fetchAnnotations()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (annotationId: string) => {
    const res = await fetch(`/api/books/${bookId}/annotations?annotationId=${annotationId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setAnnotations(prev => prev.filter(a => a.id !== annotationId))
    }
  }

  if (!open) return null

  // Group annotations: current chapter first, then rest sorted by chapterIndex
  const currentChapterAnnotations = annotations.filter(a => a.chapterIndex === currentChapterIndex)
  const otherAnnotations = annotations.filter(a => a.chapterIndex !== currentChapterIndex)

  // Build grouped list: current chapter first, then group others by chapterIndex
  const otherGrouped = otherAnnotations.reduce<Record<number, AnnotationItem[]>>((acc, a) => {
    if (!acc[a.chapterIndex]) acc[a.chapterIndex] = []
    acc[a.chapterIndex].push(a)
    return acc
  }, {})

  return (
    <>
      <div
        aria-label="关闭批注"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 49, background: 'rgba(0,0,0,0.3)' }}
      />
      <div
        role="dialog"
        aria-label="批注列表"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--bg-surface)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '20px 0 32px',
          animation: 'slide-up 280ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>我的批注</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { setShowAddForm(v => !v); setAddContent('') }}
              style={{
                background: 'var(--accent-500)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--bg-surface)',
                padding: '6px 12px',
              }}
            >
              为本章添加批注
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add annotation form */}
        {showAddForm && (
          <div style={{ padding: '0 20px 16px' }}>
            <textarea
              value={addContent}
              onChange={e => setAddContent(e.target.value)}
              maxLength={520}
              placeholder="输入批注内容..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: addContent.length > 500 ? 'var(--error)' : 'var(--text-muted)' }}>
                {addContent.length}/500
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddContent('') }}
                  style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', padding: '5px 12px' }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!addContent.trim() || addContent.length > 500 || saving}
                  style={{
                    background: (!addContent.trim() || addContent.length > 500 || saving) ? 'var(--text-disabled)' : 'var(--accent-500)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (!addContent.trim() || addContent.length > 500 || saving) ? 'default' : 'pointer',
                    fontSize: '13px',
                    color: 'var(--bg-surface)',
                    padding: '5px 12px',
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px 20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            加载中...
          </p>
        ) : annotations.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            还没有批注，点击右上角为当前章节添加
          </p>
        ) : (
          <div>
            {/* Current chapter section */}
            {currentChapterAnnotations.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {chapterTitles[currentChapterIndex] ?? `第${currentChapterIndex + 1}章`}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    background: 'var(--accent-500)',
                    color: 'var(--bg-surface)',
                    borderRadius: '4px',
                    padding: '1px 6px',
                  }}>
                    当前章节
                  </span>
                </div>
                {currentChapterAnnotations.map(a => (
                  <AnnotationItem
                    key={a.id}
                    annotation={a}
                    isEditing={editingId === a.id}
                    editContent={editContent}
                    saving={saving}
                    onJump={() => onJump(a.chapterIndex)}
                    onEdit={() => { setEditingId(a.id); setEditContent(a.content) }}
                    onEditChange={setEditContent}
                    onEditSave={() => handleEdit(a.id)}
                    onEditCancel={() => { setEditingId(null); setEditContent('') }}
                    onDelete={() => handleDelete(a.id)}
                  />
                ))}
              </div>
            )}

            {/* Other chapters */}
            {Object.entries(otherGrouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([chIdx, items]) => (
                <div key={chIdx}>
                  <div style={{ padding: '8px 20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {chapterTitles[Number(chIdx)] ?? `第${Number(chIdx) + 1}章`}
                    </span>
                  </div>
                  {items.map(a => (
                    <AnnotationItem
                      key={a.id}
                      annotation={a}
                      isEditing={editingId === a.id}
                      editContent={editContent}
                      saving={saving}
                      onJump={() => onJump(a.chapterIndex)}
                      onEdit={() => { setEditingId(a.id); setEditContent(a.content) }}
                      onEditChange={setEditContent}
                      onEditSave={() => handleEdit(a.id)}
                      onEditCancel={() => { setEditingId(null); setEditContent('') }}
                      onDelete={() => handleDelete(a.id)}
                    />
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}

interface AnnotationItemProps {
  annotation: AnnotationItem
  isEditing: boolean
  editContent: string
  saving: boolean
  onJump: () => void
  onEdit: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}

function AnnotationItem({
  annotation,
  isEditing,
  editContent,
  saving,
  onJump,
  onEdit,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
}: AnnotationItemProps) {
  const updatedAt = new Date(annotation.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

  if (isEditing) {
    return (
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <textarea
          value={editContent}
          onChange={e => onEditChange(e.target.value)}
          maxLength={520}
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: editContent.length > 500 ? 'var(--error)' : 'var(--text-muted)' }}>
            {editContent.length}/500
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onEditCancel}
              style={{ background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', padding: '4px 10px' }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={onEditSave}
              disabled={!editContent.trim() || editContent.length > 500 || saving}
              style={{
                background: (!editContent.trim() || editContent.length > 500 || saving) ? 'var(--text-disabled)' : 'var(--accent-500)',
                border: 'none',
                borderRadius: '6px',
                cursor: (!editContent.trim() || editContent.length > 500 || saving) ? 'default' : 'pointer',
                fontSize: '13px',
                color: 'var(--bg-surface)',
                padding: '4px 10px',
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ borderBottom: '1px solid var(--border-subtle)', padding: '12px 20px', cursor: 'pointer' }}
      onClick={onJump}
    >
      <p style={{
        margin: '0 0 8px',
        fontSize: '14px',
        color: 'var(--text-primary)',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {annotation.content}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{updatedAt}</span>
        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            aria-label="编辑批注"
            onClick={onEdit}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', padding: '4px 8px' }}
          >
            编辑
          </button>
          <button
            type="button"
            aria-label="删除批注"
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)', padding: '4px 8px' }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
