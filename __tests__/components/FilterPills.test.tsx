import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import FilterPills from '@/components/library/FilterPills'

describe('FilterPills', () => {
  it('renders all 4 options', () => {
    render(<FilterPills active="ALL" onChange={vi.fn()} />)
    expect(screen.getByText('全部')).toBeInTheDocument()
    expect(screen.getByText('在读')).toBeInTheDocument()
    expect(screen.getByText('想读')).toBeInTheDocument()
    expect(screen.getByText('已读')).toBeInTheDocument()
  })

  it('highlights the active option', () => {
    render(<FilterPills active="READING" onChange={vi.fn()} />)
    const readingPill = screen.getByText('在读')
    const allPill = screen.getByText('全部')
    expect(readingPill.closest('button')).toHaveStyle({ background: 'var(--accent-500)' })
    expect(allPill.closest('button')).toHaveStyle({ background: 'var(--bg-elevated)' })
  })

  it('calls onChange with correct status when pill clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)
    await user.click(screen.getByText('在读'))
    expect(onChange).toHaveBeenCalledWith('READING')
  })

  it('全部 pill is active by default when active=\'ALL\'', () => {
    render(<FilterPills active="ALL" onChange={vi.fn()} />)
    const allPill = screen.getByText('全部')
    expect(allPill.closest('button')).toHaveStyle({ background: 'var(--accent-500)' })
  })

  it('calls onChange with FINISHED when 已读 clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterPills active="ALL" onChange={onChange} />)
    await user.click(screen.getByText('已读'))
    expect(onChange).toHaveBeenCalledWith('FINISHED')
  })

  it('calls onChange with WANT when 想读 clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterPills active="READING" onChange={onChange} />)
    await user.click(screen.getByText('想读'))
    expect(onChange).toHaveBeenCalledWith('WANT')
  })

  it('renders without crashing when onChange is a no-op', () => {
    expect(() => render(<FilterPills active="ALL" onChange={() => {}} />)).not.toThrow()
  })
})
