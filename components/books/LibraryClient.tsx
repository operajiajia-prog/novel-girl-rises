'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BookStatus } from '@/types'
import BookGrid from './BookGrid'
import BookCard from './BookCard'
import UploadZone from './UploadZone'
import FilterPills from '@/components/library/FilterPills'
import SearchBar from '@/components/library/SearchBar'
import BulkActionBar from '@/components/library/BulkActionBar'

type UploadedBook = { id: string; title: string }
type LibraryBook = Pick<Book, 'id' | 'title' | 'author' | 'synopsis' | 'coverUrl' | 'genre' | 'status' | 'chapterIndex' | 'chapterCount' | 'updatedAt'>

interface LibraryClientProps {
  initialBooks: LibraryBook[]
  initialFilter?: BookStatus | 'ALL'
}

export default function LibraryClient({ initialBooks, initialFilter = 'ALL' }: LibraryClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(initialBooks.length === 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() =>
    books.filter(b =>
      b.title.includes(searchQuery) || (b.author ?? '').includes(searchQuery)
    ), [books, searchQuery])

  const handleFilterChange = useCallback((status: BookStatus | 'ALL') => {
    if (status === 'ALL') {
      router.push('/library')
    } else {
      router.push(`/library?status=${status}`)
    }
  }, [router])

  const handleUploadSuccess = useCallback((_book: UploadedBook) => {
    setShowUpload(false)
    router.refresh()
  }, [router])

  const handleStatusChange = useCallback((id: string, status: BookStatus) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id))
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkStatus = useCallback(async (status: BookStatus) => {
    const ids = [...selectedIds]
    const res = await fetch('/api/books/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: ids, action: 'status', status }),
    })
    if (res.ok) {
      setBooks(prev => prev.map(b => selectedIds.has(b.id) ? { ...b, status } : b))
      setSelectedIds(new Set())
      setSelectMode(false)
    }
  }, [selectedIds])

  const handleBulkArchive = useCallback(async () => {
    const ids = [...selectedIds]
    const res = await fetch('/api/books/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: ids, action: 'archive' }),
    })
    if (res.ok) {
      setBooks(prev => prev.filter(b => !selectedIds.has(b.id)))
      setSelectedIds(new Set())
      setSelectMode(false)
    }
  }, [selectedIds])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    const res = await fetch('/api/books/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: ids }),
    })
    if (res.ok) {
      setBooks(prev => prev.filter(b => !selectedIds.has(b.id)))
      setSelectedIds(new Set())
      setSelectMode(false)
    }
  }, [selectedIds])

  if (showUpload) {
    return (
      <div className="space-y-4">
        {initialBooks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUpload(false)}
            style={{ color: 'var(--text-muted)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← 返回书库
          </button>
        )}
        <UploadZone onSuccess={handleUploadSuccess} />
        {initialBooks.length === 0 && (
          <p className="text-center" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            上传你的第一本 TXT 小说开始旅程
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FilterPills active={initialFilter} onChange={handleFilterChange} />
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="flex justify-end" style={{ gap: '8px', display: 'flex', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setSelectMode(m => !m)
            setSelectedIds(new Set())
          }}
          style={{
            fontSize: '13px',
            color: selectMode ? 'var(--accent-400)' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {selectMode ? '完成' : '批量选择'}
        </button>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          style={{
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '12px',
            background: 'var(--accent-500)',
            color: 'var(--color-primary-foreground)',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 18px',
          }}
        >
          + 上传小说
        </button>
      </div>
      {selectMode ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          {filtered.map(book => (
            <div
              key={book.id}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => toggleSelect(book.id)}
            >
              <BookCard book={book} onStatusChange={() => {}} onDelete={() => {}} />
              {/* Checkbox overlay — positioned over BookCard, BookCard is not modified */}
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: selectedIds.has(book.id) ? 'var(--accent-500)' : 'rgba(0,0,0,0.4)',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                {selectedIds.has(book.id) && (
                  <span style={{ color: 'white', fontSize: '12px', lineHeight: 1 }}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BookGrid books={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} />
      )}
      {selectMode && selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onStatusChange={handleBulkStatus}
          onArchive={handleBulkArchive}
          onDelete={handleBulkDelete}
          onCancel={() => { setSelectMode(false); setSelectedIds(new Set()) }}
        />
      )}
    </div>
  )
}
