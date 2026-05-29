import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import BookCard from '@/components/books/BookCard'

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

const mockBook = {
  id: 'b1',
  title: '斗破苍穹',
  author: '天蚕土豆',
  coverUrl: null,
  genre: '玄幻',
  status: 'READING' as const,
  chapterIndex: 10,
  chapterCount: 100,
  updatedAt: new Date(),
}

describe('BookCard', () => {
  it('renders book title', () => {
    render(<BookCard book={mockBook} />)
    expect(screen.getByText('斗破苍穹')).toBeInTheDocument()
  })

  it('shows genre badge', () => {
    render(<BookCard book={mockBook} />)
    expect(screen.getByText('玄幻')).toBeInTheDocument()
  })

  it('shows progress bar when status is READING', () => {
    render(<BookCard book={mockBook} />)
    expect(document.querySelector('[role="progressbar"]')).toBeTruthy()
  })

  it('does not show progress bar when status is WANT', () => {
    render(<BookCard book={{ ...mockBook, status: 'WANT' }} />)
    expect(document.querySelector('[role="progressbar"]')).toBeNull()
  })

  it('links to the book reader', () => {
    render(<BookCard book={mockBook} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain('b1')
  })
})
