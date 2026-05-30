/**
 * Journey: Library Management
 * Flow: filter books → search → right-click to change status → delete
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

import FilterPills from '@/components/library/FilterPills'
import SearchBar from '@/components/library/SearchBar'
import BookContextMenu from '@/components/library/BookContextMenu'

describe('FilterPills', () => {
  it('renders all filter options and marks active one', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('在读')).toBeInTheDocument()
    expect(screen.getByText('想读')).toBeInTheDocument()
    expect(screen.getByText('已读')).toBeInTheDocument()
  })

  it('calls onChange with the clicked filter value', () => {
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)

    fireEvent.click(screen.getByText('在读'))
    expect(onChange).toHaveBeenCalledWith('READING')
  })

  it('calls onChange with FINISHED when 已读 is clicked', () => {
    const onChange = vi.fn()
    render(<FilterPills active="READING" onChange={onChange} />)

    fireEvent.click(screen.getByText('已读'))
    expect(onChange).toHaveBeenCalledWith('FINISHED')
  })
})

describe('SearchBar', () => {
  it('renders the search input with placeholder', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    expect(screen.getByPlaceholderText('搜索书名或作者…')).toBeInTheDocument()
  })

  it('calls onChange when user types into the input', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('搜索书名或作者…'), {
      target: { value: '斗破苍穹' },
    })
    expect(onChange).toHaveBeenCalledWith('斗破苍穹')
  })

  it('shows clear button when value is non-empty and clears on click', () => {
    const onChange = vi.fn()
    render(<SearchBar value="test" onChange={onChange} />)

    const clearBtn = screen.getByLabelText('clear')
    expect(clearBtn).toBeInTheDocument()
    fireEvent.click(clearBtn)
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('does not show clear button when value is empty', () => {
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    expect(screen.queryByLabelText('clear')).not.toBeInTheDocument()
  })
})

describe('BookContextMenu', () => {
  const book = { id: 'book-1', status: 'READING' as const, isArchived: false }

  it('opens context menu on right-click', () => {
    const onStatusChange = vi.fn()
    const onDelete = vi.fn()
    render(
      <BookContextMenu book={book} onStatusChange={onStatusChange} onDelete={onDelete}>
        <div>书名</div>
      </BookContextMenu>
    )

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.contextMenu(screen.getByText('书名'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('calls onStatusChange with WANT when 标为想读 is clicked', async () => {
    const onStatusChange = vi.fn()
    const onDelete = vi.fn()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    render(
      <BookContextMenu book={book} onStatusChange={onStatusChange} onDelete={onDelete}>
        <div>书名</div>
      </BookContextMenu>
    )

    fireEvent.contextMenu(screen.getByText('书名'))
    fireEvent.click(screen.getByText('标为想读'))

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('book-1', 'WANT')
    })
  })

  it('calls onStatusChange with FINISHED when 标为已读 is clicked', async () => {
    const onStatusChange = vi.fn()
    const onDelete = vi.fn()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    render(
      <BookContextMenu book={book} onStatusChange={onStatusChange} onDelete={onDelete}>
        <div>书名</div>
      </BookContextMenu>
    )

    fireEvent.contextMenu(screen.getByText('书名'))
    fireEvent.click(screen.getByText('标为已读'))

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('book-1', 'FINISHED')
    })
  })

  it('calls onDelete when 删除 is clicked', async () => {
    const onStatusChange = vi.fn()
    const onDelete = vi.fn()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    render(
      <BookContextMenu book={book} onStatusChange={onStatusChange} onDelete={onDelete}>
        <div>书名</div>
      </BookContextMenu>
    )

    fireEvent.contextMenu(screen.getByText('书名'))
    fireEvent.click(screen.getByText('删除'))

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('book-1')
    })
  })

  it('closes the menu when backdrop is clicked', () => {
    const onStatusChange = vi.fn()
    const onDelete = vi.fn()
    render(
      <BookContextMenu book={book} onStatusChange={onStatusChange} onDelete={onDelete}>
        <div>书名</div>
      </BookContextMenu>
    )

    fireEvent.contextMenu(screen.getByText('书名'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('关闭菜单'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
