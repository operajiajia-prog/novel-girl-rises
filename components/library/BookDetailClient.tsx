'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BookEditModal from './BookEditModal'
import ReviewModal from '@/components/books/ReviewModal'

interface Props {
  book: {
    id: string
    title: string
    author?: string | null
    synopsis?: string | null
    tags?: string[]
    userNotes?: string | null
    coverUrl?: string | null
    isArchived: boolean
  }
  initialNote?: { statusText: string | null; updatedAt: Date } | null
}

export default function BookDetailClient({ book, initialNote }: Props) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isArchived, setIsArchived] = useState(book.isArchived)
  const [note, setNote] = useState<{ statusText: string | null } | null>(initialNote ?? null)
  const [showReview, setShowReview] = useState(false)

  const handleSave = useCallback(() => {
    setShowEdit(false)
    router.refresh()
  }, [router])

  const handleArchive = useCallback(async () => {
    const willArchive = !isArchived
    const method = willArchive ? 'POST' : 'DELETE'
    const res = await fetch(`/api/books/${book.id}/archive`, { method })
    if (res.ok) {
      setIsArchived(willArchive)
      router.refresh()
    }
  }, [book.id, isArchived, router])

  const handleDelete = useCallback(async () => {
    const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/library')
  }, [book.id, router])

  const btnStyle = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '1.5px solid var(--border-subtle)',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
        <Link
          href={`/reader/${book.id}`}
          style={{
            flex: 2,
            padding: '13px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--accent-500)',
            color: 'var(--color-primary-foreground)',
            fontSize: '15px',
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'none',
            display: 'block',
          }}
        >
          继续阅读 →
        </Link>
        <button type="button" onClick={() => setShowEdit(true)} style={btnStyle}>
          编辑信息
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={handleArchive}
          style={{ ...btnStyle, color: 'var(--text-secondary)' }}
        >
          {isArchived ? '取消归档' : '归档'}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          style={{ ...btnStyle, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
        >
          删除
        </button>
      </div>

      {/* Review section */}
      <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>我的书评</span>
          <button
            type="button"
            onClick={() => setShowReview(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--accent-400)' }}
          >
            {note?.statusText ? '编辑' : '写书评'}
          </button>
        </div>
        {note?.statusText ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {note.statusText}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            还没有书评，读完后记录你的感受
          </p>
        )}
      </div>

      {showEdit && (
        <BookEditModal book={book} onSave={handleSave} onClose={() => setShowEdit(false)} />
      )}

      <ReviewModal
        open={showReview}
        onClose={() => setShowReview(false)}
        bookId={book.id}
        bookTitle={book.title}
        initialText={note?.statusText ?? null}
        onSaved={text => setNote({ statusText: text })}
        onDeleted={() => setNote(null)}
      />

      {showDeleteConfirm && (
        <>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 201, background: 'var(--bg-elevated)', borderRadius: '20px',
            padding: '24px 20px', width: 'min(320px, calc(100vw - 32px))',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>确定删除？</p>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-muted)' }}>删除后不可恢复，文件也会从云端移除。</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ ...btnStyle, flex: 1 }}>取消</button>
              <button
                type="button"
                onClick={handleDelete}
                style={{ ...btnStyle, flex: 1, background: 'var(--color-danger)', border: 'none', color: '#fff' }}
              >
                确定删除
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
