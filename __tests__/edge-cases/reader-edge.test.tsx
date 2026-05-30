import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ReaderClient from '@/components/reader/ReaderClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

// Mock heavy sub-components — we only care about ReaderClient logic
vi.mock('@/components/reader/SettingsSheet', () => ({
  default: () => null,
}))
vi.mock('@/components/reader/BookmarkPanel', () => ({
  default: () => null,
}))
vi.mock('@/components/reader/SwipeHandler', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Silence all fetch calls made on mount (prefs + bookmarks)
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  })
  // sessionStorage is cleared between tests
  sessionStorage.clear()
})

const makeBook = (overrides = {}) => ({
  id: 'book-1',
  title: '斗破苍穹',
  author: '天蚕土豆',
  chapterIndex: 0,
  charOffset: 0,
  chapterCount: 3,
  ...overrides,
})

const makeChapters = (count: number, content = '第一段内容') =>
  Array.from({ length: count }, (_, i) => ({
    index: i,
    title: `第 ${i + 1} 章`,
    content: i === 0 ? content : `第${i + 1}章内容`,
  }))

// Helper: reveal the overlay (prev/next buttons live inside it)
function revealOverlay() {
  const center = screen.getByTestId('reader-center')
  fireEvent.click(center)
}

describe('ReaderClient — navigation edge cases', () => {
  it('single chapter book: prev button is disabled and next button is disabled', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 0, chapterCount: 1 })}
        chapters={makeChapters(1)}
      />
    )
    revealOverlay()

    const prev = screen.getByTestId('btn-prev-chapter')
    const next = screen.getByTestId('btn-next-chapter')
    expect(prev).toBeDisabled()
    expect(next).toBeDisabled()
  })

  it('chapterIndex=0: prev button is disabled', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 0, chapterCount: 3 })}
        chapters={makeChapters(3)}
      />
    )
    revealOverlay()

    expect(screen.getByTestId('btn-prev-chapter')).toBeDisabled()
    expect(screen.getByTestId('btn-next-chapter')).not.toBeDisabled()
  })

  it('chapterIndex=chapterCount-1: next button is disabled', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 2, chapterCount: 3 })}
        chapters={makeChapters(3)}
      />
    )
    revealOverlay()

    expect(screen.getByTestId('btn-next-chapter')).toBeDisabled()
    expect(screen.getByTestId('btn-prev-chapter')).not.toBeDisabled()
  })

  it('clicking next chapter advances the chapter counter', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 0, chapterCount: 3 })}
        chapters={makeChapters(3)}
      />
    )
    revealOverlay()

    expect(screen.getByText('第 1/3 章')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('btn-next-chapter'))
    expect(screen.getByText('第 2/3 章')).toBeInTheDocument()
  })

  it('clicking prev chapter decrements the chapter counter', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 2, chapterCount: 3 })}
        chapters={makeChapters(3)}
      />
    )
    revealOverlay()

    expect(screen.getByText('第 3/3 章')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('btn-prev-chapter'))
    expect(screen.getByText('第 2/3 章')).toBeInTheDocument()
  })
})

describe('ReaderClient — content edge cases', () => {
  it('empty chapter content: renders without crashing', () => {
    const chaptersWithEmpty = [{ index: 0, title: '第 1 章', content: '' }]
    render(
      <ReaderClient
        book={makeBook({ chapterCount: 1 })}
        chapters={chaptersWithEmpty}
      />
    )
    // Chapter title should still render
    expect(screen.getByText('第 1 章')).toBeInTheDocument()
  })

  it('renders book title in overlay top bar', () => {
    render(
      <ReaderClient
        book={makeBook()}
        chapters={makeChapters(3)}
      />
    )
    revealOverlay()
    expect(screen.getByText('斗破苍穹')).toBeInTheDocument()
  })

  it('progress bar reflects single chapter as 100%', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 0, chapterCount: 1 })}
        chapters={makeChapters(1)}
      />
    )
    const bar = document.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar).toBeTruthy()
    expect(bar.style.width).toBe('100%')
  })

  it('progress bar at first chapter of multi-chapter book is 0%', () => {
    render(
      <ReaderClient
        book={makeBook({ chapterIndex: 0, chapterCount: 3 })}
        chapters={makeChapters(3)}
      />
    )
    const bar = document.querySelector('[role="progressbar"]') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })
})
