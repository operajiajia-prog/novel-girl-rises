import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SettingsSheet from '@/components/reader/SettingsSheet'
import type { ReaderSettings } from '@/components/reader/SettingsSheet'

const defaultSettings: ReaderSettings = { fontSize: 17, bgColor: '#000000', lineHeight: 1.85 }

describe('SettingsSheet', () => {
  it('renders font size, background, and line height sections when open', () => {
    render(<SettingsSheet open={true} onClose={vi.fn()} onChange={vi.fn()} settings={defaultSettings} />)
    expect(screen.getByText('字号')).toBeInTheDocument()
    expect(screen.getByText('背景')).toBeInTheDocument()
    expect(screen.getByText('行距')).toBeInTheDocument()
  })

  it('is not rendered when closed', () => {
    render(<SettingsSheet open={false} onClose={vi.fn()} onChange={vi.fn()} settings={defaultSettings} />)
    expect(screen.queryByText('字号')).not.toBeInTheDocument()
  })

  it('calls onChange with new fontSize when a font size button is clicked', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open={true} onClose={vi.fn()} onChange={onChange} settings={defaultSettings} />)
    fireEvent.click(screen.getByText('14'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ fontSize: 14 }))
  })

  it('calls onChange with new lineHeight when a line height option is clicked', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open={true} onClose={vi.fn()} onChange={onChange} settings={defaultSettings} />)
    fireEvent.click(screen.getByText('紧'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ lineHeight: 1.6 }))
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsSheet open={true} onClose={onClose} onChange={vi.fn()} settings={defaultSettings} />)
    fireEvent.click(screen.getByTestId('settings-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onChange with new bgColor when a color button is clicked', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open={true} onClose={vi.fn()} onChange={onChange} settings={defaultSettings} />)
    fireEvent.click(screen.getByTitle('米黄'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bgColor: '#F5E6C8' }))
  })

  it('renders without crashing when open transitions from false to true', () => {
    const { rerender } = render(
      <SettingsSheet open={false} onClose={vi.fn()} onChange={vi.fn()} settings={defaultSettings} />
    )
    expect(screen.queryByText('字号')).not.toBeInTheDocument()
    rerender(
      <SettingsSheet open={true} onClose={vi.fn()} onChange={vi.fn()} settings={defaultSettings} />
    )
    expect(screen.getByText('字号')).toBeInTheDocument()
  })

  it('highlights currently active font size button', () => {
    const settings: ReaderSettings = { ...defaultSettings, fontSize: 14 }
    render(<SettingsSheet open={true} onClose={vi.fn()} onChange={vi.fn()} settings={settings} />)
    const btn14 = screen.getByText('14').closest('button')
    expect(btn14).toHaveStyle({ background: 'var(--accent-100)' })
  })
})
