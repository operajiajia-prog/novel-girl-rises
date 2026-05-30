import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import SearchBar from '@/components/library/SearchBar'

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.getByPlaceholderText('搜索书名或作者…')).toBeInTheDocument()
  })

  it('calls onChange when typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchBar value="" onChange={onChange} />)
    await user.type(screen.getByPlaceholderText('搜索书名或作者…'), 'a')
    expect(onChange).toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('shows clear button when value is non-empty', () => {
    render(<SearchBar value="斗破苍穹" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('calls onChange with empty string when clear button clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchBar value="斗破苍穹" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /clear/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('does not show clear button when value is empty', () => {
    render(<SearchBar value="" onChange={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })

  it('renders without crashing with empty string value', () => {
    expect(() => render(<SearchBar value="" onChange={() => {}} />)).not.toThrow()
  })
})
