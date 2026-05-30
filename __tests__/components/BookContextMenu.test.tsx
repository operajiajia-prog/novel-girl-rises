import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import BookContextMenu from '@/components/library/BookContextMenu'
import type { BookStatus } from '@prisma/client'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => '/',
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const defaultBook = { id: 'book-1', status: 'READING' as BookStatus, isArchived: false }

function renderMenu(
  book = defaultBook,
  overrides: { onStatusChange?: any; onDelete?: any; onArchiveChange?: any } = {}
) {
  const onStatusChange = overrides.onStatusChange ?? vi.fn()
  const onDelete = overrides.onDelete ?? vi.fn()
  const onArchiveChange = overrides.onArchiveChange ?? vi.fn()

  const result = render(
    <BookContextMenu
      book={book}
      onStatusChange={onStatusChange}
      onDelete={onDelete}
      onArchiveChange={onArchiveChange}
    >
      <div data-testid="trigger">child content</div>
    </BookContextMenu>
  )
  return { ...result, onStatusChange, onDelete, onArchiveChange }
}

describe('BookContextMenu', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    // Default: fetch succeeds
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  it('does not render menu initially', () => {
    renderMenu()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('renders children', () => {
    renderMenu()
    expect(screen.getByTestId('trigger')).toBeInTheDocument()
  })

  it('right-click opens the menu', () => {
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('shows status items for all statuses except the current one', () => {
    // book.status = READING → should show WANT and FINISHED options
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByText('标为想读')).toBeInTheDocument()
    expect(screen.getByText('标为已读')).toBeInTheDocument()
    // Should NOT show "标为在读" (current status)
    expect(screen.queryByText('标为在读')).toBeNull()
  })

  it('shows only 2 status items when current status is READING', () => {
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    const menuItems = screen.getAllByRole('menuitem')
    // 2 status items + archive + delete = 4
    expect(menuItems).toHaveLength(4)
  })

  it('clicking a status item calls fetch PATCH and onStatusChange', async () => {
    const onStatusChange = vi.fn()
    renderMenu(defaultBook, { onStatusChange })
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    fireEvent.click(screen.getByText('标为想读'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/books/book-1',
        expect.objectContaining({ method: 'PATCH' })
      )
      expect(onStatusChange).toHaveBeenCalledWith('book-1', 'WANT')
    })
  })

  it('clicking a status item closes the menu', async () => {
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByText('标为想读'))
    // Menu should close synchronously (closeMenu is called before await)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('clicking delete calls fetch DELETE and onDelete', async () => {
    const onDelete = vi.fn()
    renderMenu(defaultBook, { onDelete })
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    fireEvent.click(screen.getByText('删除'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/books/book-1',
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(onDelete).toHaveBeenCalledWith('book-1')
    })
  })

  it('pressing Escape closes the menu', () => {
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('clicking backdrop closes the menu', () => {
    renderMenu()
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('关闭菜单'))
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('shows "归档" when book is not archived', () => {
    renderMenu({ ...defaultBook, isArchived: false })
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByText('归档')).toBeInTheDocument()
    expect(screen.queryByText('取消归档')).toBeNull()
  })

  it('shows "取消归档" when book is archived', () => {
    renderMenu({ ...defaultBook, isArchived: true })
    fireEvent.contextMenu(screen.getByTestId('trigger'))
    expect(screen.getByText('取消归档')).toBeInTheDocument()
    expect(screen.queryByText('归档')).toBeNull()
  })

  it('menu DOM is absent when menu is closed', () => {
    renderMenu()
    // Never opened
    expect(document.querySelector('[role="menu"]')).toBeNull()
  })
})
