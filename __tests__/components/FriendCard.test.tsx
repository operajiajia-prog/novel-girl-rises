import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import FriendCard from '@/components/social/FriendCard'

describe('FriendCard', () => {
  const baseFriend = { id: 'u1', username: 'alice', avatarUrl: null }

  it('renders username', () => {
    render(<FriendCard friend={baseFriend} />)
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('renders avatar image when avatarUrl provided', () => {
    const friend = { ...baseFriend, avatarUrl: 'https://example.com/avatar.png' }
    render(<FriendCard friend={friend} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png')
  })

  it('renders first letter when no avatarUrl', () => {
    render(<FriendCard friend={baseFriend} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows reading book title', () => {
    render(<FriendCard friend={baseFriend} readingBook={{ title: '斗破苍穹' }} />)
    expect(screen.getByText('正在读「斗破苍穹」')).toBeInTheDocument()
  })

  it('shows 暂无在读 when no book', () => {
    render(<FriendCard friend={baseFriend} />)
    expect(screen.getByText('暂无在读')).toBeInTheDocument()
  })
})
