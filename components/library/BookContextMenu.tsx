'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { BookStatus } from '@prisma/client'

export interface BookContextMenuProps {
  book: { id: string; status: BookStatus }
  onStatusChange: (id: string, status: BookStatus) => void
  onDelete: (id: string) => void
  children: React.ReactNode
}

const STATUS_LABELS: Record<BookStatus, string> = {
  READING: '标为在读',
  WANT: '标为想读',
  FINISHED: '标为已读',
}

const ALL_STATUSES: BookStatus[] = ['READING', 'WANT', 'FINISHED']

export default function BookContextMenu({
  book,
  onStatusChange,
  onDelete,
  children,
}: BookContextMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const openMenu = useCallback(() => setOpen(true), [])
  const closeMenu = useCallback(() => setOpen(false), [])

  // Long-press handlers
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(openMenu, 500)
  }, [openMenu])

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Right-click handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      openMenu()
    },
    [openMenu]
  )

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  const handleStatusChange = useCallback(
    async (status: BookStatus) => {
      closeMenu()
      try {
        const res = await fetch(`/api/books/${book.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (res.ok) {
          onStatusChange(book.id, status)
          router.refresh()
        } else {
          router.refresh() // re-sync on error
        }
      } catch {
        router.refresh() // re-sync on network failure
      }
    },
    [book.id, closeMenu, onStatusChange, router]
  )

  const handleDelete = useCallback(async () => {
    closeMenu()
    try {
      const res = await fetch(`/api/books/${book.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(book.id)
        router.refresh()
      }
    } catch {
      // Swallow
    }
  }, [book.id, closeMenu, onDelete, router])

  return (
    <div
      style={{ display: 'contents' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
      onContextMenu={handleContextMenu}
    >
      {children}

      {open && (
        <>
          {/* Backdrop */}
          <div
            aria-label="关闭菜单"
            onClick={closeMenu}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.25)',
            }}
          />

          {/* Menu */}
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 101,
              background: 'var(--bg-elevated)',
              borderRadius: '16px',
              overflow: 'hidden',
              minWidth: '200px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
            }}
          >
            {ALL_STATUSES.filter((s) => s !== book.status).map((status) => (
              <button
                key={status}
                role="menuitem"
                type="button"
                onClick={() => handleStatusChange(status)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-default)',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                }}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}

            <button
              role="menuitem"
              type="button"
              onClick={handleDelete}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 20px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                color: 'var(--destructive, #FF453A)',
              }}
            >
              删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}
