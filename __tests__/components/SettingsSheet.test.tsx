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

describe('Enhanced settings — font, brightness, paragraph spacing', () => {
  const baseSettings: ReaderSettings = {
    fontSize: 17,
    bgColor: '#F5E6C8',
    lineHeight: 1.85,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    brightness: 1.0,
    paragraphSpacing: 0,
  }

  it('renders 4 font family buttons', () => {
    render(<SettingsSheet open settings={baseSettings} onChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('默认')).toBeInTheDocument()
    expect(screen.getByText('宋体')).toBeInTheDocument()
    expect(screen.getByText('楷体')).toBeInTheDocument()
    expect(screen.getByText('黑体')).toBeInTheDocument()
  })

  it('clicking a font button calls onChange with correct fontFamily', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open settings={baseSettings} onChange={onChange} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('宋体'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ fontFamily: '"SimSun", "STSong", Georgia, serif' })
    )
  })

  it('renders brightness slider', () => {
    render(<SettingsSheet open settings={baseSettings} onChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByTestId('brightness-slider')).toBeInTheDocument()
  })

  it('brightness slider change calls onChange with brightness in 0-1 range', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open settings={baseSettings} onChange={onChange} onClose={vi.fn()} />)
    fireEvent.change(screen.getByTestId('brightness-slider'), { target: { value: '80' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ brightness: 0.8 }))
  })

  it('renders paragraph spacing slider', () => {
    render(<SettingsSheet open settings={baseSettings} onChange={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByTestId('paragraph-spacing-slider')).toBeInTheDocument()
  })

  it('paragraph spacing slider change calls onChange with spacing in em units', () => {
    const onChange = vi.fn()
    render(<SettingsSheet open settings={baseSettings} onChange={onChange} onClose={vi.fn()} />)
    fireEvent.change(screen.getByTestId('paragraph-spacing-slider'), { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ paragraphSpacing: 1.0 }))
  })
})
