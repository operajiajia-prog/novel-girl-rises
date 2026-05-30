// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock global fetch
global.fetch = vi.fn()

import SearchOverlay from '@/components/reader/SearchOverlay'

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  bookId: 'book1',
  onJump: vi.fn(),
}

describe('SearchOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when open=false', () => {
    const { container } = render(
      <SearchOverlay {...defaultProps} open={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders search input when open', () => {
    render(<SearchOverlay {...defaultProps} />)
    expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument()
  })

  it('calls search API after 300ms debounce', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as any)

    render(<SearchOverlay {...defaultProps} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '主角' } })

    // Should not call fetch immediately
    expect(global.fetch).not.toHaveBeenCalled()

    // Advance timers by 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/books/book1/search?q=')
      )
    })
  })

  it('displays search results with chapter title and snippet', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { chapterIndex: 0, chapterTitle: '第一章 序幕', snippet: '这是…主角…的故事' },
          { chapterIndex: 1, chapterTitle: '第二章 开始', snippet: '主角开始了旅程' },
        ],
      }),
    } as any)

    render(<SearchOverlay {...defaultProps} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '主角' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText('第一章 序幕')).toBeInTheDocument()
      expect(screen.getByText('第二章 开始')).toBeInTheDocument()
    })
  })

  it('clicking a result calls onJump and onClose', async () => {
    const onJump = vi.fn()
    const onClose = vi.fn()

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { chapterIndex: 2, chapterTitle: '第三章 高潮', snippet: '到达了目的地' },
        ],
      }),
    } as any)

    render(<SearchOverlay {...defaultProps} onJump={onJump} onClose={onClose} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '目的地' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText('第三章 高潮')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('第三章 高潮'))
    expect(onJump).toHaveBeenCalledWith(2)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows empty state when no results', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as any)

    render(<SearchOverlay {...defaultProps} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '不存在的词' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText(/没有找到.*相关内容/)).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching', async () => {
    let resolvePromise!: (value: any) => void
    const fetchPromise = new Promise((resolve) => { resolvePromise = resolve })
    vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise as any)

    render(<SearchOverlay {...defaultProps} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '主角' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('search-loading')).toBeInTheDocument()
    })

    // Cleanup - resolve the promise
    resolvePromise({ ok: true, json: async () => ({ results: [] }) })
  })

  it('clear button clears input and results', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { chapterIndex: 0, chapterTitle: '第一章', snippet: '主角出场' },
        ],
      }),
    } as any)

    render(<SearchOverlay {...defaultProps} />)
    const input = screen.getByPlaceholderText('搜索...')
    fireEvent.change(input, { target: { value: '主角' } })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(screen.getByText('第一章')).toBeInTheDocument()
    })

    // Click clear button
    fireEvent.click(screen.getByTestId('search-clear-btn'))

    expect(input).toHaveValue('')
    // Results should be cleared
    expect(screen.queryByText('第一章')).not.toBeInTheDocument()
  })

  it('shows prompt text when input is empty', () => {
    render(<SearchOverlay {...defaultProps} />)
    expect(screen.getByText('输入关键词，在书中搜索')).toBeInTheDocument()
  })
})
