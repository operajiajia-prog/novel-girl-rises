/**
 * Journey: Social Flow
 * Flow: search user → send friend request → accept/reject friend request cards
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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

import AddFriendModal from '@/components/social/AddFriendModal'
import FriendRequestCard from '@/components/social/FriendRequestCard'

describe('AddFriendModal', () => {
  it('renders the modal with search input', () => {
    render(<AddFriendModal onClose={vi.fn()} />)
    expect(screen.getByText('添加好友')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('搜索用户名')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<AddFriendModal onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('关闭'))
    expect(onClose).toHaveBeenCalled()
  })

  it('searches users after debounce and shows results', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: 'user-1', username: 'testuser', avatarUrl: null }],
      }),
    })
    global.fetch = mockFetch

    render(<AddFriendModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('搜索用户名'), {
      target: { value: 'testuser' },
    })

    // advance debounce timer then flush microtasks
    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/search?q=testuser')
    )
  })

  it('sends friend request and shows 已发送 after success', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ id: 'user-2', username: 'alice', avatarUrl: null }],
        }),
      })
      .mockResolvedValueOnce({ ok: true })

    global.fetch = mockFetch

    render(<AddFriendModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('搜索用户名'), {
      target: { value: 'alice' },
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('发送请求'))

    await waitFor(() => {
      expect(screen.getByText('已发送')).toBeInTheDocument()
    })
    expect(mockFetch).toHaveBeenCalledWith('/api/friends/user-2', { method: 'POST' })
  })

  it('clears results when query is emptied', async () => {
    vi.useFakeTimers()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [{ id: 'user-3', username: 'bob', avatarUrl: null }],
      }),
    })
    global.fetch = mockFetch

    render(<AddFriendModal onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('搜索用户名'), {
      target: { value: 'bob' },
    })

    await act(async () => {
      vi.advanceTimersByTime(350)
    })

    vi.useRealTimers()

    await waitFor(() => screen.getByText('bob'))

    // Clear the search
    fireEvent.change(screen.getByPlaceholderText('搜索用户名'), {
      target: { value: '' },
    })

    await waitFor(() => {
      expect(screen.queryByText('bob')).not.toBeInTheDocument()
    })
  })
})

describe('FriendRequestCard', () => {
  const requester = { id: 'req-1', username: 'charlie', avatarUrl: null }

  it('renders the requester username', () => {
    render(
      <FriendRequestCard requester={requester} onAccept={vi.fn()} onReject={vi.fn()} />
    )
    expect(screen.getByText('charlie')).toBeInTheDocument()
  })

  it('calls onAccept when 接受 button is clicked', () => {
    const onAccept = vi.fn()
    const onReject = vi.fn()
    render(
      <FriendRequestCard requester={requester} onAccept={onAccept} onReject={onReject} />
    )

    fireEvent.click(screen.getByText('接受'))
    expect(onAccept).toHaveBeenCalled()
    expect(onReject).not.toHaveBeenCalled()
  })

  it('calls onReject when 拒绝 button is clicked', () => {
    const onAccept = vi.fn()
    const onReject = vi.fn()
    render(
      <FriendRequestCard requester={requester} onAccept={onAccept} onReject={onReject} />
    )

    fireEvent.click(screen.getByText('拒绝'))
    expect(onReject).toHaveBeenCalled()
    expect(onAccept).not.toHaveBeenCalled()
  })

  it('shows avatar initial letter when no avatarUrl', () => {
    render(
      <FriendRequestCard requester={requester} onAccept={vi.fn()} onReject={vi.fn()} />
    )
    // Charlie → 'C'
    expect(screen.getByText('C')).toBeInTheDocument()
  })
})
