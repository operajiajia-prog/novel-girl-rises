import { render, screen } from '@testing-library/react'
import ActivityItem from '@/components/social/ActivityItem'

const baseActivity = {
  id: 'a1',
  createdAt: '2026-05-01T10:00:00Z',
  user: { username: 'alice', avatarUrl: null },
}

describe('ActivityItem', () => {
  it('renders BOOK_ADDED text correctly', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'BOOK_ADDED',
          book: { title: '斗破苍穹', coverUrl: null },
        }}
      />
    )
    expect(screen.getByText('「斗破苍穹」加入书库')).toBeInTheDocument()
  })

  it('renders READING_STARTED text correctly', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'READING_STARTED',
          book: { title: '完美世界', coverUrl: null },
        }}
      />
    )
    expect(screen.getByText('开始阅读「完美世界」')).toBeInTheDocument()
  })

  it('renders BOOK_FINISHED text with 🎉', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'BOOK_FINISHED',
          book: { title: '遮天', coverUrl: null },
        }}
      />
    )
    expect(screen.getByText('读完了「遮天」🎉')).toBeInTheDocument()
  })

  it('renders BOOKLIST_UPDATED text (no book needed)', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'BOOKLIST_UPDATED',
          book: null,
        }}
      />
    )
    expect(screen.getByText('更新了书单')).toBeInTheDocument()
  })

  it('renders username', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'BOOKLIST_UPDATED',
          book: null,
        }}
      />
    )
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('renders avatar initial (uppercase) when avatarUrl is null', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          actionType: 'BOOKLIST_UPDATED',
          book: null,
        }}
      />
    )
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders avatar image when avatarUrl is provided', () => {
    render(
      <ActivityItem
        activity={{
          ...baseActivity,
          user: { username: 'alice', avatarUrl: 'https://example.com/avatar.png' },
          actionType: 'BOOKLIST_UPDATED',
          book: null,
        }}
      />
    )
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.png')
  })

  it('renders without crashing when book is null for BOOK_ADDED', () => {
    expect(() =>
      render(
        <ActivityItem
          activity={{
            ...baseActivity,
            actionType: 'BOOK_ADDED',
            book: null,
          }}
        />
      )
    ).not.toThrow()
  })
})
