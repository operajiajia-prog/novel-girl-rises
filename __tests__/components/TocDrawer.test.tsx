// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TocDrawer from '@/components/reader/TocDrawer'

const chapters = [
  { index: 0, title: '第一章 开始' },
  { index: 1, title: '第二章 发展' },
  { index: 2, title: '第三章 高潮' },
]

describe('TocDrawer', () => {
  it('returns null when open=false', () => {
    const { container } = render(
      <TocDrawer open={false} onClose={vi.fn()} chapters={chapters} currentIndex={0} onJump={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders all chapter titles when open', () => {
    render(
      <TocDrawer open onClose={vi.fn()} chapters={chapters} currentIndex={0} onJump={vi.fn()} />
    )
    expect(screen.getByText('第一章 开始')).toBeInTheDocument()
    expect(screen.getByText('第二章 发展')).toBeInTheDocument()
    expect(screen.getByText('第三章 高潮')).toBeInTheDocument()
  })

  it('clicking a chapter button calls onJump with correct index and calls onClose', () => {
    const onJump = vi.fn()
    const onClose = vi.fn()
    render(
      <TocDrawer open onClose={onClose} chapters={chapters} currentIndex={0} onJump={onJump} />
    )
    fireEvent.click(screen.getByText('第二章 发展'))
    expect(onJump).toHaveBeenCalledWith(1)
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the backdrop calls onClose', () => {
    const onClose = vi.fn()
    render(
      <TocDrawer open onClose={onClose} chapters={chapters} currentIndex={0} onJump={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId('toc-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('clicking the close button calls onClose', () => {
    const onClose = vi.fn()
    render(
      <TocDrawer open onClose={onClose} chapters={chapters} currentIndex={0} onJump={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId('toc-close-btn'))
    expect(onClose).toHaveBeenCalled()
  })

  it('current chapter has data-current attribute', () => {
    render(
      <TocDrawer open onClose={vi.fn()} chapters={chapters} currentIndex={1} onJump={vi.fn()} />
    )
    const currentBtn = screen.getByText('第二章 发展').closest('button')
    expect(currentBtn).toHaveAttribute('data-current', 'true')
    const otherBtn = screen.getByText('第一章 开始').closest('button')
    expect(otherBtn).not.toHaveAttribute('data-current', 'true')
  })
})
