'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BookStatus } from '@/types'
import BookGrid from './BookGrid'
import UploadZone from './UploadZone'
import FilterPills from '@/components/library/FilterPills'
import SearchBar from '@/components/library/SearchBar'

type UploadedBook = { id: string; title: string }
type LibraryBook = Pick<Book, 'id' | 'title' | 'author' | 'coverUrl' | 'genre' | 'status' | 'chapterIndex' | 'chapterCount' | 'updatedAt'>

interface LibraryClientProps {
  initialBooks: LibraryBook[]
  initialFilter?: BookStatus | 'ALL'
}

export default function LibraryClient({ initialBooks, initialFilter = 'ALL' }: LibraryClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(initialBooks.length === 0)
  const [searchQuery, setSearchQuery] = useState('')
  const [books, setBooks] = useState<LibraryBook[]>(initialBooks)

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
      <div className="flex justify-end">
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
      <BookGrid books={filtered} onStatusChange={handleStatusChange} onDelete={handleDelete} />
    </div>
  )
}
