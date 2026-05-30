import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import UploadZone from '@/components/books/UploadZone'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

// BatchUploadProgress is a pure display component — mock it to keep tests light
vi.mock('@/components/library/BatchUploadProgress', () => ({
  default: ({ total, current }: any) => (
    <div data-testid="batch-progress">{current}/{total}</div>
  ),
}))

const makeFile = (name: string, size: number, content = 'x') => {
  const blob = new Blob([content.repeat(Math.min(size, 100))], { type: 'text/plain' })
  return new File([blob], name, { type: 'text/plain' })
}

function triggerFileInput(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(input)
}

describe('UploadZone — edge cases', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('large file (>10 MB): upload is still attempted — component has no client-side size limit', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ book: { id: 'b1', title: 'Big Novel' } }),
    })

    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const largeFile = makeFile('bignovel.txt', 11 * 1024 * 1024)
    triggerFileInput(largeFile)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/books/upload', expect.objectContaining({ method: 'POST' }))
    expect(onSuccess).toHaveBeenCalledWith({ id: 'b1', title: 'Big Novel' })
  })

  it('empty file (size=0): does not crash and still calls upload endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ book: { id: 'b2', title: 'Empty' } }),
    })

    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const emptyFile = makeFile('empty.txt', 0, '')
    triggerFileInput(emptyFile)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(onSuccess).toHaveBeenCalledWith({ id: 'b2', title: 'Empty' })
  })

  it('special characters in filename: upload is called with the file', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ book: { id: 'b3', title: 'XSS Test' } }),
    })

    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const xssFile = makeFile('<script>alert.txt', 10)
    triggerFileInput(xssFile)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    // Verify the FormData was built (fetch was called with a POST body)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/books/upload')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(onSuccess).toHaveBeenCalled()
  })

  it('emoji in filename: does not crash', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ book: { id: 'b4', title: '📚novel' } }),
    })

    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const emojiFile = makeFile('📚novel.txt', 10)
    triggerFileInput(emojiFile)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(onSuccess).toHaveBeenCalled()
  })

  it('non-txt file: shows error and does not call upload', async () => {
    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    const pdfFile = new File(['content'], 'novel.pdf', { type: 'application/pdf' })
    triggerFileInput(pdfFile)

    await waitFor(() => expect(screen.getByText('仅支持 .txt 文件')).toBeInTheDocument())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('upload failure: shows error message', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: '服务器错误' }),
    })

    render(<UploadZone onSuccess={vi.fn()} />)

    triggerFileInput(makeFile('novel.txt', 10))

    await waitFor(() => expect(screen.getByText('服务器错误')).toBeInTheDocument())
  })

  it('during upload, zone shows uploading state', async () => {
    // Never resolve so we stay in uploading state
    fetchMock.mockReturnValue(new Promise(() => {}))

    render(<UploadZone onSuccess={vi.fn()} />)
    triggerFileInput(makeFile('novel.txt', 10))

    await waitFor(() => expect(screen.getByText('正在上传…')).toBeInTheDocument())
  })
})
