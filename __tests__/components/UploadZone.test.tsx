import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import UploadZone from '@/components/books/UploadZone'

global.fetch = vi.fn()

describe('UploadZone', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders upload prompt', () => {
    render(<UploadZone onSuccess={vi.fn()} />)
    expect(screen.getByText(/上传/i)).toBeInTheDocument()
  })

  it('shows error for non-txt file', async () => {
    render(<UploadZone onSuccess={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    // applyAccept: false bypasses userEvent's accept-attribute filtering so we
    // can test the component's own client-side extension validation
    await userEvent.upload(input, file, { applyAccept: false })
    await waitFor(() => {
      expect(screen.getByText(/txt/i)).toBeInTheDocument()
    })
  })

  it('calls onSuccess after successful upload', async () => {
    const onSuccess = vi.fn()
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ book: { id: 'b1', title: '测试书' } }),
    } as any)

    render(<UploadZone onSuccess={onSuccess} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['第一章 开始\n内容'], 'test.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }))
    })
  })

  it('shows error message on upload failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '仅支持 .txt 文件' }),
    } as any)

    render(<UploadZone onSuccess={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'book.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('仅支持 .txt 文件')).toBeInTheDocument()
    })
  })

  it('shows 正在上传… during upload (loading state)', async () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}) as any)

    render(<UploadZone onSuccess={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'book.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/正在上传/i)).toBeInTheDocument()
    })
  })

  it('shows network error message when fetch rejects', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network'))

    render(<UploadZone onSuccess={vi.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['content'], 'book.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText(/上传失败/i)).toBeInTheDocument()
    })
  })
})
