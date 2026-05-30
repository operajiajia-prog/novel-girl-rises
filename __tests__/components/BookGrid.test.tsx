import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import BookGrid from '@/components/books/BookGrid'
import type { BookStatus } from '@prisma/client'

vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }))
vi.mock('next/link', () => ({ default: ({ children, href }: any) => <a href={href}>{children}</a> }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}))

// Mock sub-components so assertions are isolated
vi.mock('@/components/books/BookCardSkeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}))
vi.mock('@/components/ui/EmptyState', () => ({
  default: ({ title }: { title: string }) => <div data-testid="empty-state">{title}</div>,
}))
vi.mock('@/components/books/BookCard', () => ({
  default: ({ book, onStatusChange, onDelete }: any) => (
    <div
      data-testid="book-card"
      data-book-id={book.id}
      data-on-status-change={onStatusChange ? 'yes' : 'no'}
      data-on-delete={onDelete ? 'yes' : 'no'}
    >
      {book.title}
    </div>
  ),
}))

const makeBook = (id: string) => ({
  id,
  title: `Book ${id}`,
  status: 'READING' as BookStatus,
})

describe('BookGrid', () => {
  it('shows skeletons when loading=true', () => {
    render(<BookGrid loading={true} skeletonCount={4} />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(4)
    expect(screen.queryByTestId('book-card')).toBeNull()
  })

  it('uses default skeletonCount=6 when not specified', () => {
    render(<BookGrid loading={true} />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
  })

  it('shows EmptyState when loading=false and books=[]', () => {
    render(<BookGrid loading={false} books={[]} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.queryByTestId('book-card')).toBeNull()
  })

  it('renders a BookCard for each book when not loading', () => {
    const books = [makeBook('1'), makeBook('2'), makeBook('3')]
    render(<BookGrid loading={false} books={books} />)
    expect(screen.getAllByTestId('book-card')).toHaveLength(3)
    expect(screen.queryByTestId('skeleton')).toBeNull()
    expect(screen.queryByTestId('empty-state')).toBeNull()
  })

  it('passes onStatusChange to each BookCard', () => {
    const onStatusChange = vi.fn()
    render(<BookGrid books={[makeBook('1')]} onStatusChange={onStatusChange} />)
    expect(screen.getByTestId('book-card').dataset.onStatusChange).toBe('yes')
  })

  it('passes onDelete to each BookCard', () => {
    const onDelete = vi.fn()
    render(<BookGrid books={[makeBook('1')]} onDelete={onDelete} />)
    expect(screen.getByTestId('book-card').dataset.onDelete).toBe('yes')
  })

  it('does not crash when books prop is undefined (defaults to [])', () => {
    render(<BookGrid loading={false} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('does not render skeletons when loading=false with books', () => {
    render(<BookGrid loading={false} books={[makeBook('x')]} />)
    expect(screen.queryByTestId('skeleton')).toBeNull()
  })
})
