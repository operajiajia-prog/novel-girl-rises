import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BookEditModal from '@/components/library/BookEditModal'

const mockBook = {
  id: 'book1',
  title: '测试书名',
  author: '作者',
  synopsis: '简介内容',
  tags: ['标签一'],
  userNotes: '我的备注',
  coverUrl: null,
}

global.fetch = vi.fn()

describe('BookEditModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders all form fields with initial values', () => {
    render(<BookEditModal book={mockBook} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('测试书名')).toBeInTheDocument()
    expect(screen.getByDisplayValue('作者')).toBeInTheDocument()
    expect(screen.getByDisplayValue('简介内容')).toBeInTheDocument()
    expect(screen.getByDisplayValue('我的备注')).toBeInTheDocument()
  })

  it('disables save button when title is empty', () => {
    render(<BookEditModal book={mockBook} onSave={vi.fn()} onClose={vi.fn()} />)
    const titleInput = screen.getByDisplayValue('测试书名')
    fireEvent.change(titleInput, { target: { value: '' } })
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled()
  })

  it('calls PATCH /api/books/[id] on save', async () => {
    const mockFetch = vi.mocked(global.fetch)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response)
    const onSave = vi.fn()
    render(<BookEditModal book={mockBook} onSave={onSave} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/books/book1', expect.objectContaining({ method: 'PATCH' }))
    })
    expect(onSave).toHaveBeenCalled()
  })

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn()
    render(<BookEditModal book={mockBook} onSave={vi.fn()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders without crashing when optional fields are null', () => {
    expect(() =>
      render(
        <BookEditModal
          book={{ id: 'b1', title: '只有书名', author: null, synopsis: null, userNotes: null, coverUrl: null }}
          onSave={vi.fn()}
          onClose={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('shows 保存中… and disables button while saving', async () => {
    // Never resolves so button stays in saving state
    vi.mocked(global.fetch).mockReturnValueOnce(new Promise(() => {}))
    render(<BookEditModal book={mockBook} onSave={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => {
      expect(screen.getByText('保存中…')).toBeInTheDocument()
    })
    expect(screen.getByText('保存中…').closest('button')).toBeDisabled()
  })

  it('shows dialog role element', () => {
    render(<BookEditModal book={mockBook} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
