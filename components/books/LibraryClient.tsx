'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Book, BookStatus } from '@/types'
import BookGrid from './BookGrid'
import UploadZone from './UploadZone'
import FilterPills from '@/components/library/FilterPills'
import SearchBar from '@/components/library/SearchBar'

type UploadedBook = { id: string; title: string }

interface LibraryClientProps {
  initialBooks: Pick<Book, 'id' | 'title' | 'author' | 'coverUrl' | 'genre' | 'status' | 'chapterIndex' | 'chapterCount' | 'updatedAt'>[]
  initialFilter?: BookStatus | 'ALL'
}

export default function LibraryClient({ initialBooks, initialFilter = 'ALL' }: LibraryClientProps) {
  const router = useRouter()
  const [showUpload, setShowUpload] = useState(initialBooks.length === 0)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() =>
    initialBooks.filter(b =>
      b.title.includes(searchQuery) || (b.author ?? '').includes(searchQuery)
    ), [initialBooks, searchQuery])

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
            color: 'var(--bg-base)',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 18px',
          }}
        >
          + 上传小说
        </button>
      </div>
      <BookGrid books={filtered} />
    </div>
  )
}
