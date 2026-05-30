'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import SettingsSheet from './SettingsSheet'
import type { ReaderSettings } from './SettingsSheet'
import TocDrawer from './TocDrawer'
import SearchOverlay from './SearchOverlay'
import AnnotationPanel from './AnnotationPanel'

interface Chapter { index: number; title: string; content: string }
interface BookInfo {
  id: string; title: string; author: string | null
  chapterIndex: number; charOffset: number; chapterCount: number
}

interface Props {
  book: BookInfo
  chapters: Chapter[]
}

const STORAGE_KEY = 'reader-settings'
const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  bgColor: '#F5E6C8',
  lineHeight: 1.85,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  brightness: 1.0,
  paragraphSpacing: 0,
}

function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export default function ReaderClient({ book, chapters }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(book.chapterIndex)
  const [showOverlay, setShowOverlay] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS)
  const containerRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  // Apply expand animation from BookCard position
  useEffect(() => {
    const origin = sessionStorage.getItem('reader-origin')
    if (origin && containerRef.current) {
      try {
        const rect = JSON.parse(origin) as { top: number; left: number; width: number; height: number }
        sessionStorage.removeItem('reader-origin')
        const vw = window.innerWidth
        const vh = window.innerHeight
        const expandX = `${(rect.left / vw * 100).toFixed(1)}%`
        const expandY = `${(rect.top / vh * 100).toFixed(1)}%`
        containerRef.current.style.setProperty('--expand-x', expandX)
        containerRef.current.style.setProperty('--expand-y', expandY)
        containerRef.current.style.animation = 'book-expand 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
      } catch {
        // ignore malformed sessionStorage data
      }
    }
  }, [])

  // Save progress with debounce when chapter changes (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/books/${book.id}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterIndex: currentIndex, charOffset: 0 }),
      })
    }, 800)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [currentIndex, book.id])

  // Scroll to top when chapter changes
  useEffect(() => {
    if (containerRef.current && typeof containerRef.current.scrollTo === 'function') {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [currentIndex])

  const handleSettingsChange = useCallback((s: ReaderSettings) => {
    setSettings(s)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  }, [])

  const chapter = chapters[currentIndex] ?? chapters[0]
  const progress = chapters.length > 1 ? (currentIndex / (chapters.length - 1)) * 100 : 100

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        background: settings.bgColor,
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      {/* Overlay (top + bottom bars) */}
      <div
        data-testid="reader-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          opacity: showOverlay ? 1 : 0,
          pointerEvents: showOverlay ? 'auto' : 'none',
          transition: 'opacity 200ms ease',
          zIndex: 20,
        }}
      >
        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(50,35,10,0.18), transparent)',
        }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '15px', padding: '8px' }}
          >
            ← 返回
          </button>
          <button
            type="button"
            onClick={() => setShowToc(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, padding: '4px 8px' }}
          >
            {book.title}
          </button>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '15px', padding: '8px' }}
            >
              🔍
            </button>
            <button
              type="button"
              onClick={() => setShowAnnotations(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '15px', padding: '8px' }}
              aria-label="章节批注"
            >
              📝
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '15px', padding: '8px' }}
            >
              ⚙ 设置
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px',
          background: 'linear-gradient(to top, rgba(50,35,10,0.18), transparent)',
        }}>
          <button
            type="button"
            data-testid="btn-prev-chapter"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            style={{
              background: 'none', border: 'none', cursor: currentIndex === 0 ? 'default' : 'pointer',
              color: currentIndex === 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
              fontSize: '15px', padding: '8px',
            }}
          >
            ← 上一章
          </button>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px', color: 'var(--text-muted)',
          }}>
            第 {currentIndex + 1}/{chapters.length} 章
          </span>
          <button
            type="button"
            data-testid="btn-next-chapter"
            disabled={currentIndex >= chapters.length - 1}
            onClick={() => setCurrentIndex(i => Math.min(chapters.length - 1, i + 1))}
            style={{
              background: 'none', border: 'none',
              cursor: currentIndex >= chapters.length - 1 ? 'default' : 'pointer',
              color: currentIndex >= chapters.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
              fontSize: '15px', padding: '8px',
            }}
          >
            下一章 →
          </button>
        </div>
      </div>

      {/* Content area (clickable center) */}
      <div
        data-testid="reader-center"
        onClick={() => setShowOverlay(v => !v)}
        style={{ minHeight: '100vh', padding: '24px 20px 48px', cursor: 'default' }}
      >
        <div style={{
          maxWidth: '680px',
          margin: '0 auto',
          filter: settings.brightness < 1.0 ? `brightness(${settings.brightness})` : undefined,
        }}>
          <h2 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '16px', fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '24px',
          }}>
            {chapter?.title}
          </h2>
          {chapter?.content.split(/\n\n+/).map((paragraph, i) => (
            <p
              key={i}
              style={{
                fontFamily: settings.fontFamily,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                margin: 0,
                marginBottom: settings.paragraphSpacing > 0 ? `${settings.paragraphSpacing}em` : '0',
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div
        role="progressbar"
        aria-valuenow={currentIndex}
        aria-valuemin={0}
        aria-valuemax={chapters.length - 1}
        style={{
          position: 'fixed',
          bottom: 0, left: 0,
          height: '2px',
          width: `${progress}%`,
          background: 'var(--accent-500)',
          zIndex: 15,
          transition: 'width 300ms ease',
        }}
      />

      {/* TOC drawer */}
      <TocDrawer
        open={showToc}
        onClose={() => setShowToc(false)}
        chapters={chapters.map(c => ({ index: c.index, title: c.title }))}
        currentIndex={currentIndex}
        onJump={idx => setCurrentIndex(idx)}
      />

      {/* Settings sheet */}
      <SettingsSheet
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onChange={handleSettingsChange}
      />

      {/* Search overlay */}
      <SearchOverlay
        open={showSearch}
        onClose={() => setShowSearch(false)}
        bookId={book.id}
        onJump={(idx) => { setCurrentIndex(idx); setShowSearch(false) }}
      />

      {/* Annotation panel */}
      <AnnotationPanel
        open={showAnnotations}
        onClose={() => setShowAnnotations(false)}
        bookId={book.id}
        currentChapterIndex={currentIndex}
        chapterTitles={chapters.map(c => c.title)}
        onJump={(idx) => { setCurrentIndex(idx); setShowAnnotations(false) }}
      />
    </div>
  )
}
