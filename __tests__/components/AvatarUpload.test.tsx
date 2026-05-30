import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi } from 'vitest'
import AvatarUpload from '@/components/profile/AvatarUpload'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AvatarUpload', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('shows avatar img when currentAvatarUrl is provided', () => {
    render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.png" username="alice" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  it('shows username initial when currentAvatarUrl is null', () => {
    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows uppercase initial from username', () => {
    render(<AvatarUpload currentAvatarUrl={null} username="bob" />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('clicking the button triggers file input click', () => {
    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    const button = screen.getByRole('button', { name: '上传头像' })
    // Spy on click of the hidden input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
    fireEvent.click(button)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('selecting a file triggers fetch POST to /api/profile/avatar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: 'https://example.com/new.png' }),
    })

    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    const file = new File(['image data'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(input)
    })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/profile/avatar',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows loading overlay while uploading', async () => {
    // Create a promise we can control to keep fetch pending
    let resolveFetch!: (v: any) => void
    const pendingPromise = new Promise((res) => { resolveFetch = res })
    mockFetch.mockReturnValueOnce(pendingPromise)

    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    act(() => { fireEvent.change(input) })

    // While fetch is pending, loading overlay should be visible
    await waitFor(() => {
      expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    // Clean up by resolving the fetch
    await act(async () => {
      resolveFetch({ ok: false })
    })
  })

  it('shows new avatar URL after successful upload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: 'https://example.com/new-avatar.png' }),
    })

    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(input)
    })

    await waitFor(() => {
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('src', 'https://example.com/new-avatar.png')
    })
  })

  it('calls onUploadSuccess after successful upload', async () => {
    const onUploadSuccess = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: 'https://example.com/avatar.png' }),
    })

    render(
      <AvatarUpload
        currentAvatarUrl={null}
        username="alice"
        onUploadSuccess={onUploadSuccess}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(input)
    })

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('hides loading overlay after upload completes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ avatarUrl: 'https://example.com/avatar.png' }),
    })

    render(<AvatarUpload currentAvatarUrl={null} username="alice" />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['data'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })

    await act(async () => {
      fireEvent.change(input)
    })

    await waitFor(() => {
      expect(document.querySelector('[aria-hidden="true"]')).toBeNull()
    })
  })
})
