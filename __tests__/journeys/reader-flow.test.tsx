/**
 * Journey: Reader Flow
 * Flow: open book → view chapter content → navigate chapters → change settings
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}))
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  })
})
afterEach(() => {
  vi.restoreAllMocks()
})

import SettingsSheet from '@/components/reader/SettingsSheet'
import ReaderClient from '@/components/reader/ReaderClient'

const MOCK_CHAPTERS = [
  { index: 0, title: '第一章：起点', content: '这是第一章的内容，充满了希望。' },
  { index: 1, title: '第二章：挑战', content: '这是第二章的内容，遇到了挑战。' },
  { index: 2, title: '第三章：成长', content: '这是第三章的内容，获得了成长。' },
]

const MOCK_BOOK = {
  id: 'book-abc',
  title: '崛起吧小说妹',
  author: '匿名作者',
  chapterIndex: 0,
  charOffset: 0,
  chapterCount: 3,
}

describe('SettingsSheet', () => {
  const baseSettings = { fontSize: 17, bgColor: '#F5E6C8', lineHeight: 1.85 }

  it('does not render when closed', () => {
    const onChange = vi.fn()
    render(
      <SettingsSheet open={false} onClose={vi.fn()} settings={baseSettings} onChange={onChange} />
    )
    expect(screen.queryByText('字号')).not.toBeInTheDocument()
  })

  it('renders font size options when open', () => {
    render(
      <SettingsSheet open={true} onClose={vi.fn()} settings={baseSettings} onChange={vi.fn()} />
    )
    expect(screen.getByText('字号')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('calls onChange with updated fontSize when a size button is clicked', () => {
    const onChange = vi.fn()
    render(
      <SettingsSheet open={true} onClose={vi.fn()} settings={baseSettings} onChange={onChange} />
    )

    fireEvent.click(screen.getByText('20'))
    expect(onChange).toHaveBeenCalledWith({ ...baseSettings, fontSize: 20 })
  })

  it('calls onChange with updated bgColor when a background button is clicked', () => {
    const onChange = vi.fn()
    render(
      <SettingsSheet open={true} onClose={vi.fn()} settings={baseSettings} onChange={onChange} />
    )

    const whiteBtn = screen.getByTitle('白')
    fireEvent.click(whiteBtn)
    expect(onChange).toHaveBeenCalledWith({ ...baseSettings, bgColor: '#FFFFFF' })
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <SettingsSheet open={true} onClose={onClose} settings={baseSettings} onChange={vi.fn()} />
    )

    fireEvent.click(screen.getByTestId('settings-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('ReaderClient chapter navigation', () => {
  it('displays the first chapter content on initial render', async () => {
    render(<ReaderClient book={MOCK_BOOK} chapters={MOCK_CHAPTERS} />)

    await waitFor(() => {
      expect(screen.getByText('第一章：起点')).toBeInTheDocument()
    })
    expect(screen.getByText('这是第一章的内容，充满了希望。')).toBeInTheDocument()
  })

  it('shows chapter progress indicator', async () => {
    render(<ReaderClient book={MOCK_BOOK} chapters={MOCK_CHAPTERS} />)

    // reveal overlay by clicking the center area
    await waitFor(() => screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('reader-center'))

    await waitFor(() => {
      expect(screen.getByText('第 1/3 章')).toBeInTheDocument()
    })
  })

  it('navigates to next chapter when 下一章 button is clicked', async () => {
    render(<ReaderClient book={MOCK_BOOK} chapters={MOCK_CHAPTERS} />)

    // reveal overlay
    await waitFor(() => screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('reader-center'))

    await waitFor(() => screen.getByTestId('btn-next-chapter'))
    fireEvent.click(screen.getByTestId('btn-next-chapter'))

    await waitFor(() => {
      expect(screen.getByText('第二章：挑战')).toBeInTheDocument()
    })
  })

  it('prev chapter button is disabled on the first chapter', async () => {
    render(<ReaderClient book={MOCK_BOOK} chapters={MOCK_CHAPTERS} />)

    // reveal overlay
    await waitFor(() => screen.getByTestId('reader-center'))
    fireEvent.click(screen.getByTestId('reader-center'))

    await waitFor(() => screen.getByTestId('btn-prev-chapter'))
    expect(screen.getByTestId('btn-prev-chapter')).toBeDisabled()
  })
})
