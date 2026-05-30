'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  bookId: string
  onJump: (chapterIndex: number) => void
}

interface SearchResult {
  chapterIndex: number
  chapterTitle: string
  snippet: string
}

function highlightKeyword(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lowerText.indexOf(lowerQuery)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: 'var(--accent-500)',
          color: 'var(--bg-base)',
          borderRadius: '2px',
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchOverlay({ open, onClose, bookId, onJump }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(
          `/api/books/${bookId}/search?q=${encodeURIComponent(q)}`
        )
        if (res.ok) {
          const data = await res.json()
          setResults(data.results ?? [])
        }
      } catch {
        // ignore errors
      } finally {
        setLoading(false)
        setSearched(true)
      }
    },
    [bookId]
  )

  useEffect(() => {
    if (!open) return
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      doSearch(val)
    }, 300)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    inputRef.current?.focus()
  }

  const handleResultClick = (chapterIndex: number) => {
    onJump(chapterIndex)
    onClose()
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top section: search input + close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索..."
            value={query}
            onChange={handleInputChange}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text-primary)',
            }}
          />
          {query && (
            <button
              data-testid="search-clear-btn"
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '16px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>
        <button
          data-testid="search-close-btn"
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '15px',
            padding: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          关闭
        </button>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div data-testid="search-loading">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: '60px',
                  borderRadius: '8px',
                  background: 'var(--bg-surface)',
                  marginBottom: '12px',
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : !query.trim() ? (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginTop: '40px',
            }}
          >
            输入关键词，在书中搜索
          </p>
        ) : searched && results.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
              marginTop: '40px',
            }}
          >
            没有找到&ldquo;{query}&rdquo;相关内容
          </p>
        ) : (
          results.map((result) => (
            <button
              key={result.chapterIndex}
              data-testid="search-result"
              type="button"
              onClick={() => handleResultClick(result.chapterIndex)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                {result.chapterTitle}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {highlightKeyword(result.snippet, query)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
