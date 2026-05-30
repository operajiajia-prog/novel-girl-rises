'use client'

import { useCallback } from 'react'

interface BookmarkItem {
  id: string
  chapterIndex: number
  charOffset: number
  label: string | null
  createdAt: string
}

interface BookmarkPanelProps {
  open: boolean
  onClose: () => void
  bookmarks: BookmarkItem[]
  chapterTitles: string[]
  onJump: (chapterIndex: number) => void
  onDelete: (chapterIndex: number, charOffset: number) => void
}

export default function BookmarkPanel({
  open,
  onClose,
  bookmarks,
  chapterTitles,
  onJump,
  onDelete,
}: BookmarkPanelProps) {
  const handleJump = useCallback((chapterIndex: number) => {
    onJump(chapterIndex)
    onClose()
  }, [onJump, onClose])

  if (!open) return null

  return (
    <>
      <div
        aria-label="关闭书签"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-overlay)' as unknown as number, background: 'rgba(0,0,0,0.3)' }}
      />
      <div
        role="dialog"
        aria-label="书签列表"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-sheet)' as unknown as number,
          background: 'var(--bg-elevated)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '20px 0 32px',
          animation: 'slide-up 280ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>书签</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-muted)' }}
          >
            ×
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            还没有书签，点击顶栏书签图标添加
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {bookmarks.map(bm => (
              <li
                key={bm.id}
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleJump(bm.chapterIndex)}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {chapterTitles[bm.chapterIndex] ?? `第 ${bm.chapterIndex + 1} 章`}
                    </p>
                    {bm.label && (
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {bm.label}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="删除书签"
                    onClick={() => onDelete(bm.chapterIndex, bm.charOffset)}
                    style={{
                      padding: '14px 20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
