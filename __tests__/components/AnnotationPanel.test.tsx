// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }))

global.fetch = vi.fn()

import AnnotationPanel from '@/components/reader/AnnotationPanel'

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  bookId: 'book1',
  currentChapterIndex: 2,
  chapterTitles: ['第一章 开始', '第二章 发展', '第三章 高潮', '第四章 结局'],
  onJump: vi.fn(),
}

const mockAnnotations = [
  { id: 'a1', chapterIndex: 2, content: '当前章节的精彩内容', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'a2', chapterIndex: 0, content: '第一章的感悟', createdAt: '2024-01-02T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z' },
]

describe('AnnotationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ annotations: mockAnnotations }),
    } as any)
  })

  it('open=false 时不渲染', () => {
    const { container } = render(<AnnotationPanel {...defaultProps} open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('加载并展示批注列表', async () => {
    render(<AnnotationPanel {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('当前章节的精彩内容')).toBeInTheDocument()
      expect(screen.getByText('第一章的感悟')).toBeInTheDocument()
    })
  })

  it('当前章节批注置顶并有 badge', async () => {
    render(<AnnotationPanel {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('当前章节')).toBeInTheDocument()
    })
    // The current chapter annotation should appear before others
    const items = screen.getAllByRole('dialog')
    expect(items).toHaveLength(1)
    const dialog = items[0]
    const badge = screen.getByText('当前章节')
    expect(dialog).toContainElement(badge)
  })

  it('点击批注调用 onJump（传入正确 chapterIndex）', async () => {
    const onJump = vi.fn()
    render(<AnnotationPanel {...defaultProps} onJump={onJump} />)
    await waitFor(() => {
      expect(screen.getByText('第一章的感悟')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('第一章的感悟'))
    expect(onJump).toHaveBeenCalledWith(0)
  })

  it('点击「添加批注」展开 textarea', async () => {
    render(<AnnotationPanel {...defaultProps} />)
    fireEvent.click(screen.getByText('为本章添加批注'))
    expect(screen.getByPlaceholderText('输入批注内容...')).toBeInTheDocument()
  })

  it('输入超 500 字时保存按钮禁用', async () => {
    render(<AnnotationPanel {...defaultProps} />)
    fireEvent.click(screen.getByText('为本章添加批注'))
    const textarea = screen.getByPlaceholderText('输入批注内容...')
    fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } })
    const saveBtn = screen.getAllByText('保存')[0]
    expect(saveBtn).toBeDisabled()
  })

  it('保存后批注出现在列表（fetch called with POST）', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ annotations: mockAnnotations }) } as any) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ annotation: { id: 'a3', chapterIndex: 2, content: '新批注内容', createdAt: new Date().toISOString() } }) } as any) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => ({ annotations: [...mockAnnotations, { id: 'a3', chapterIndex: 2, content: '新批注内容', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] }) } as any) // refetch

    render(<AnnotationPanel {...defaultProps} />)

    await waitFor(() => screen.getByText('当前章节的精彩内容'))

    fireEvent.click(screen.getByText('为本章添加批注'))
    const textarea = screen.getByPlaceholderText('输入批注内容...')
    fireEvent.change(textarea, { target: { value: '新批注内容' } })

    const saveBtn = screen.getAllByText('保存')[0]
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        expect.stringContaining('/api/books/book1/annotations'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('新批注内容')).toBeInTheDocument()
    })
  })

  it('点击删除调用 DELETE API', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ annotations: mockAnnotations }) } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as any)

    render(<AnnotationPanel {...defaultProps} />)
    await waitFor(() => screen.getByText('当前章节的精彩内容'))

    const deleteButtons = screen.getAllByLabelText('删除批注')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        expect.stringContaining('annotationId=a1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  it('空态时显示引导文字', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ annotations: [] }),
    } as any)
    render(<AnnotationPanel {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByText('还没有批注，点击右上角为当前章节添加')).toBeInTheDocument()
    })
  })
})
