import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import UploadZone from '@/components/books/UploadZone'
import FilterPills from '@/components/library/FilterPills'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))

vi.mock('@/components/library/BatchUploadProgress', () => ({
  default: ({ total, current }: any) => (
    <div data-testid="batch-progress">{current}/{total}</div>
  ),
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

function triggerFileInput(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(input)
}

const makeTxtFile = (name = 'novel.txt') =>
  new File(['content'], name, { type: 'text/plain' })

// ─── UploadZone concurrent tests ─────────────────────────────────────────────

describe('UploadZone — concurrent interactions', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rapid double file-change: both uploads are fired (component has no in-flight guard), zone shows uploading state', async () => {
    // UploadZone does NOT prevent a second upload while one is in flight —
    // handleFiles / uploadSingle have no guard on the `uploading` state flag.
    // This test documents the actual behavior so regressions are caught if the
    // component is hardened later.
    const neverResolve = new Promise<never>(() => {})
    fetchMock.mockReturnValue(neverResolve)

    render(<UploadZone onSuccess={vi.fn()} />)

    // First file triggers upload
    triggerFileInput(makeTxtFile('first.txt'))

    // Wait for uploading state to be visible
    await waitFor(() => expect(screen.getByText('正在上传…')).toBeInTheDocument())

    // Second file change while still uploading
    triggerFileInput(makeTxtFile('second.txt'))

    // Small tick to allow any microtasks to flush
    await new Promise(r => setTimeout(r, 50))

    // Both uploads fire (no guard in the component today)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    // And the zone still reflects uploading state
    expect(screen.getByText('正在上传…')).toBeInTheDocument()
  })

  it('upload failure clears uploading state so a retry is possible', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: '网络错误' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ book: { id: 'b1', title: 'OK' } }) })

    const onSuccess = vi.fn()
    render(<UploadZone onSuccess={onSuccess} />)

    // First attempt — fails
    triggerFileInput(makeTxtFile())
    await waitFor(() => expect(screen.getByText('网络错误')).toBeInTheDocument())

    // Zone should no longer show "正在上传…"
    expect(screen.queryByText('正在上传…')).not.toBeInTheDocument()

    // Retry — should succeed
    triggerFileInput(makeTxtFile())
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ id: 'b1', title: 'OK' }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

// ─── FilterPills concurrent tests ────────────────────────────────────────────

describe('FilterPills — rapid filter switching', () => {
  it('each rapid click fires onFilterChange with the correct value', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    fireEvent.click(screen.getByText('想读'))
    fireEvent.click(screen.getByText('在读'))
    fireEvent.click(screen.getByText('已读'))

    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenNthCalledWith(1, 'WANT')
    expect(onChange).toHaveBeenNthCalledWith(2, 'READING')
    expect(onChange).toHaveBeenNthCalledWith(3, 'FINISHED')
  })

  it('clicking the same pill twice fires onChange twice (no deduplication)', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    fireEvent.click(screen.getByText('在读'))
    fireEvent.click(screen.getByText('在读'))

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenNthCalledWith(1, 'READING')
    expect(onChange).toHaveBeenNthCalledWith(2, 'READING')
  })

  it('all four filter options are rendered', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('在读')).toBeInTheDocument()
    expect(screen.getByText('想读')).toBeInTheDocument()
    expect(screen.getByText('已读')).toBeInTheDocument()
  })

  it('clicking 全部 fires onChange with ALL', () => {
    const onChange = vi.fn()
    render(<FilterPills active="READING" onChange={onChange} />)

    fireEvent.click(screen.getByText('全部'))
    expect(onChange).toHaveBeenCalledWith('ALL')
  })

  it('rapid full cycle through all filters: all callbacks fire in order', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    fireEvent.click(screen.getByText('全部'))
    fireEvent.click(screen.getByText('在读'))
    fireEvent.click(screen.getByText('想读'))
    fireEvent.click(screen.getByText('已读'))

    expect(onChange).toHaveBeenCalledTimes(4)
    const calls = onChange.mock.calls.map(c => c[0])
    expect(calls).toEqual(['ALL', 'READING', 'WANT', 'FINISHED'])
  })
})
