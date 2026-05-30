// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BulkActionBar from '@/components/library/BulkActionBar'

describe('BulkActionBar', () => {
  const defaultProps = {
    selectedCount: 3,
    onStatusChange: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
  }

  it('displays selected count', () => {
    render(<BulkActionBar {...defaultProps} />)
    expect(screen.getByText('已选 3 本')).toBeInTheDocument()
  })

  it('clicking 在读 calls onStatusChange with READING', () => {
    const onStatusChange = vi.fn()
    render(<BulkActionBar {...defaultProps} onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByText('在读'))
    expect(onStatusChange).toHaveBeenCalledWith('READING')
  })

  it('clicking 想读 calls onStatusChange with WANT', () => {
    const onStatusChange = vi.fn()
    render(<BulkActionBar {...defaultProps} onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByText('想读'))
    expect(onStatusChange).toHaveBeenCalledWith('WANT')
  })

  it('clicking 已读 calls onStatusChange with FINISHED', () => {
    const onStatusChange = vi.fn()
    render(<BulkActionBar {...defaultProps} onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByText('已读'))
    expect(onStatusChange).toHaveBeenCalledWith('FINISHED')
  })

  it('clicking 归档 calls onArchive', () => {
    const onArchive = vi.fn()
    render(<BulkActionBar {...defaultProps} onArchive={onArchive} />)
    fireEvent.click(screen.getByText('归档'))
    expect(onArchive).toHaveBeenCalled()
  })

  it('clicking 取消 calls onCancel', () => {
    const onCancel = vi.fn()
    render(<BulkActionBar {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('取消'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('clicking 删除 calls onDelete after window.confirm returns true', () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true)
    render(<BulkActionBar {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('删除'))
    expect(onDelete).toHaveBeenCalled()
  })

  it('does NOT call onDelete when window.confirm returns false', () => {
    const onDelete = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    render(<BulkActionBar {...defaultProps} onDelete={onDelete} />)
    fireEvent.click(screen.getByText('删除'))
    expect(onDelete).not.toHaveBeenCalled()
  })
})
