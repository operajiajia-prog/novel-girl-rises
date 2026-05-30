import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import FriendRequestCard from '@/components/social/FriendRequestCard'

const defaultRequester = {
  id: 'user-1',
  username: 'alice',
  avatarUrl: null as string | null | undefined,
}

describe('FriendRequestCard', () => {
  it('renders requester username', () => {
    render(
      <FriendRequestCard
        requester={defaultRequester}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('shows avatar img when avatarUrl is provided', () => {
    render(
      <FriendRequestCard
        requester={{ ...defaultRequester, avatarUrl: 'https://example.com/avatar.png' }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    )
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
    expect(img).toHaveAttribute('alt', 'alice')
  })

  it('shows username initial when avatarUrl is null', () => {
    render(
      <FriendRequestCard
        requester={{ ...defaultRequester, avatarUrl: null }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows username initial when avatarUrl is undefined', () => {
    const { avatarUrl: _omit, ...requesterWithoutAvatar } = defaultRequester
    render(
      <FriendRequestCard
        requester={requesterWithoutAvatar}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('initial is uppercase', () => {
    render(
      <FriendRequestCard
        requester={{ ...defaultRequester, username: 'bob', avatarUrl: null }}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    )
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('clicking 接受 button calls onAccept', () => {
    const onAccept = vi.fn()
    render(
      <FriendRequestCard
        requester={defaultRequester}
        onAccept={onAccept}
        onReject={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '接受' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('clicking 拒绝 button calls onReject', () => {
    const onReject = vi.fn()
    render(
      <FriendRequestCard
        requester={defaultRequester}
        onAccept={vi.fn()}
        onReject={onReject}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '拒绝' }))
    expect(onReject).toHaveBeenCalledTimes(1)
  })

  it('clicking 接受 does not call onReject', () => {
    const onAccept = vi.fn()
    const onReject = vi.fn()
    render(
      <FriendRequestCard
        requester={defaultRequester}
        onAccept={onAccept}
        onReject={onReject}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '接受' }))
    expect(onReject).not.toHaveBeenCalled()
  })

  it('does not crash when avatarUrl is null', () => {
    expect(() =>
      render(
        <FriendRequestCard
          requester={{ id: 'u1', username: 'test', avatarUrl: null }}
          onAccept={vi.fn()}
          onReject={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('does not crash when avatarUrl is undefined', () => {
    expect(() =>
      render(
        <FriendRequestCard
          requester={{ id: 'u1', username: 'test' }}
          onAccept={vi.fn()}
          onReject={vi.fn()}
        />
      )
    ).not.toThrow()
  })
})
