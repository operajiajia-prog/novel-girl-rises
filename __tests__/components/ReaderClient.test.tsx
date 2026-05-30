import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

// Mock fetch for progress saving
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })

import ReaderClient from '@/components/reader/ReaderClient'

const mockChapters = [
  { index: 0, title: '第一章 开端', content: '这是第一章的正文内容，非常精彩。' },
  { index: 1, title: '第二章 发展', content: '这是第二章的正文内容，更加精彩。' },
  { index: 2, title: '第三章 高潮', content: '这是第三章的正文内容，最为精彩。' },
]

const mockBook = {
  id: 'book1',
  title: '测试书',
  author: '作者名',
  chapterIndex: 0,
  charOffset: 0,
  chapterCount: 3,
}

describe('ReaderClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders first chapter content', () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    expect(screen.getByText('这是第一章的正文内容，非常精彩。')).toBeInTheDocument()
  })

  it('shows bottom progress bar', () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('overlay is hidden by default (pointer-events none or hidden)', () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    // The overlay wrapper should have opacity 0 by default
    const overlay = screen.getByTestId('reader-overlay')
    expect(overlay.style.opacity).toBe('0')
  })

  it('shows overlay on center click', async () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    const overlay = screen.getByTestId('reader-overlay')
    expect(overlay.style.opacity).toBe('1')
  })

  it('hides overlay on second center click', async () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('reader-center'))
    const overlay = screen.getByTestId('reader-overlay')
    expect(overlay.style.opacity).toBe('0')
  })

  it('navigates to next chapter on button click', async () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('btn-next-chapter'))
    expect(screen.getByText('这是第二章的正文内容，更加精彩。')).toBeInTheDocument()
  })

  it('navigates to prev chapter on button click', async () => {
    render(<ReaderClient book={{ ...mockBook, chapterIndex: 1 }} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('btn-prev-chapter'))
    expect(screen.getByText('这是第一章的正文内容，非常精彩。')).toBeInTheDocument()
  })

  it('disables prev button on first chapter', () => {
    render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    const prevBtn = screen.getByTestId('btn-prev-chapter')
    expect(prevBtn).toBeDisabled()
  })

  it('disables next button on last chapter', () => {
    render(<ReaderClient book={{ ...mockBook, chapterIndex: 2 }} chapters={mockChapters} />)
    fireEvent.click(screen.getByTestId('reader-center'))
    const nextBtn = screen.getByTestId('btn-next-chapter')
    expect(nextBtn).toBeDisabled()
  })

  it('starts on saved chapter from book.chapterIndex', () => {
    render(<ReaderClient book={{ ...mockBook, chapterIndex: 2 }} chapters={mockChapters} />)
    expect(screen.getByText('这是第三章的正文内容，最为精彩。')).toBeInTheDocument()
  })

  it('renders without crashing when fetch rejects (graceful degradation)', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network'))
    expect(() =>
      render(<ReaderClient book={mockBook} chapters={mockChapters} />)
    ).not.toThrow()
    await waitFor(() => {
      expect(screen.getByText('这是第一章的正文内容，非常精彩。')).toBeInTheDocument()
    })
  })

  it('renders single-chapter book without crashing', () => {
    const single = [{ index: 0, title: '唯一章节', content: '只有一章。' }]
    expect(() =>
      render(<ReaderClient book={{ ...mockBook, chapterCount: 1 }} chapters={single} />)
    ).not.toThrow()
  })
})
