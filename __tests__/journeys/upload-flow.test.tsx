/**
 * Journey: Upload Flow
 * Flow: select file → upload progress → success / error states
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
  global.fetch = vi.fn()
})
afterEach(() => {
  vi.restoreAllMocks()
})

import UploadZone from '@/components/books/UploadZone'

function makeTxtFile(name = 'novel.txt', content = '第一章 内容') {
  return new File([content], name, { type: 'text/plain' })
}

describe('UploadZone', () => {
  it('renders upload zone with initial idle state', () => {
    render(<UploadZone onSuccess={vi.fn()} />)
    expect(screen.getByText('点击或拖拽上传小说文件')).toBeInTheDocument()
    expect(screen.getByText('仅支持纯文本小说文件')).toBeInTheDocument()
  })

  it('shows uploading state while upload is in progress', async () => {
    // Make fetch resolve after a delay so we can observe intermediate state
    let resolveFetch!: (value: any) => void
    const pendingFetch = new Promise<any>((resolve) => { resolveFetch = resolve })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(pendingFetch)

    render(<UploadZone onSuccess={vi.fn()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeTxtFile()
    Object.defineProperty(input, 'files', { value: [file], writable: false })
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText('正在上传…')).toBeInTheDocument()
    })

    // Resolve to avoid hanging
    resolveFetch({ ok: true, json: async () => ({ book: { id: '1', title: 'novel' } }) })
  })

  it('calls onSuccess and returns to idle after successful upload', async () => {
    const onSuccess = vi.fn()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ book: { id: 'book-123', title: '斗破苍穹' } }),
    })

    render(<UploadZone onSuccess={onSuccess} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeTxtFile('doupo.txt')
    Object.defineProperty(input, 'files', { value: [file], writable: false })
    fireEvent.change(input)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ id: 'book-123', title: '斗破苍穹' })
    })

    // After success, should return to idle text
    await waitFor(() => {
      expect(screen.getByText('点击或拖拽上传小说文件')).toBeInTheDocument()
    })
  })

  it('shows error message when upload fails with server error', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: '文件格式错误' }),
    })

    render(<UploadZone onSuccess={vi.fn()} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeTxtFile()
    Object.defineProperty(input, 'files', { value: [file], writable: false })
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText('文件格式错误')).toBeInTheDocument()
    })
  })

  it('shows error for non-txt file without making a fetch call', async () => {
    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const nonTxtFile = new File(['content'], 'novel.pdf', { type: 'application/pdf' })
    Object.defineProperty(input, 'files', { value: [nonTxtFile], writable: false })
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText('仅支持 .txt 文件')).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows drag-over styling when a file is dragged over the zone', () => {
    render(<UploadZone onSuccess={vi.fn()} />)

    const dropZone = screen.getByRole('button', { name: '上传 TXT 小说' })

    // Before drag: default border references --border-default
    expect(dropZone.getAttribute('style')).toContain('var(--border-default)')

    fireEvent.dragOver(dropZone, { preventDefault: () => {} })

    // After drag over: border references --accent-500
    expect(dropZone.getAttribute('style')).toContain('var(--accent-500)')
  })
})
