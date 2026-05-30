'use client'

import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  chapters: Array<{ index: number; title: string }>
  currentIndex: number
  onJump: (index: number) => void
}

export default function TocDrawer({ open, onClose, chapters, currentIndex, onJump }: Props) {
  const currentRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open && currentRef.current && typeof currentRef.current.scrollIntoView === 'function') {
      currentRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="toc-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 50,
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          background: 'var(--bg-card)',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
            章节目录
          </span>
          <button
            data-testid="toc-close-btn"
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'var(--text-muted)',
              lineHeight: 1,
              padding: '4px',
            }}
            aria-label="关闭目录"
          >
            ✕
          </button>
        </div>

        {/* Chapter list */}
        <div data-testid="toc-chapter-list" style={{ flex: 1, overflowY: 'auto' }}>
          {chapters.map(chapter => {
            const isCurrent = chapter.index === currentIndex
            return (
              <button
                key={chapter.index}
                ref={isCurrent ? currentRef : undefined}
                type="button"
                data-current={isCurrent ? 'true' : undefined}
                onClick={() => { onJump(chapter.index); onClose() }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  background: isCurrent ? 'var(--accent-950)' : 'transparent',
                  color: isCurrent ? 'var(--accent-400)' : 'var(--text-secondary)',
                  fontWeight: isCurrent ? 600 : 400,
                  transition: 'background 150ms',
                }}
              >
                {chapter.title}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
