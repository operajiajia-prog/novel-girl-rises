import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, afterEach, describe, it } from 'vitest'
import AddFriendModal from '@/components/social/AddFriendModal'

global.fetch = vi.fn()

describe('AddFriendModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders search input', () => {
    render(<AddFriendModal onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/搜索用户名/i)).toBeInTheDocument()
  })

  it('calls search API after typing (with debounce)', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ users: [] }),
    } as any)

    render(<AddFriendModal onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/搜索用户名/i)

    // Use fireEvent to avoid userEvent async timer conflicts
    act(() => {
      fireEvent.change(input, { target: { value: 'ali' } })
    })

    // Before debounce fires, fetch should not be called
    expect(fetch).not.toHaveBeenCalled()

    // Advance past 300ms debounce
    await act(async () => {
      vi.advanceTimersByTime(350)
      // Allow microtasks (fetch mock) to resolve
      await Promise.resolve()
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/search?q=ali')
    )

    vi.useRealTimers()
  })

  it('shows search results', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: 'u2', username: 'alice', avatarUrl: null }],
      }),
    } as any)

    render(<AddFriendModal onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/搜索用户名/i)

    act(() => {
      fireEvent.change(input, { target: { value: 'ali' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
    })
  })

  it('silently handles network error during search', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network'))

    render(<AddFriendModal onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/搜索用户名/i)

    act(() => {
      fireEvent.change(input, { target: { value: 'ali' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    vi.useRealTimers()

    // Component should still render (not crash) and show no results
    expect(screen.getByPlaceholderText(/搜索用户名/i)).toBeInTheDocument()
  })

  it('shows 已发送 after request succeeds', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ id: 'u2', username: 'alice', avatarUrl: null }],
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any)

    render(<AddFriendModal onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/搜索用户名/i)

    act(() => {
      fireEvent.change(input, { target: { value: 'ali' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    const sendBtn = screen.getByRole('button', { name: '发送请求' })
    await userEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('已发送')).toBeInTheDocument()
    })
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<AddFriendModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls send friend request on button click', async () => {
    vi.useFakeTimers()
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ id: 'u2', username: 'alice', avatarUrl: null }],
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any)

    render(<AddFriendModal onClose={vi.fn()} />)
    const input = screen.getByPlaceholderText(/搜索用户名/i)

    act(() => {
      fireEvent.change(input, { target: { value: 'ali' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
      await Promise.resolve()
      await Promise.resolve()
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    const sendBtn = screen.getByRole('button', { name: '发送请求' })
    await userEvent.click(sendBtn)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/friends/u2'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
