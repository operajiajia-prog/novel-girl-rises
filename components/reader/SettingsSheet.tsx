'use client'

export interface ReaderSettings {
  fontSize: number
  bgColor: string
  lineHeight: number
}

interface Props {
  open: boolean
  onClose: () => void
  settings: ReaderSettings
  onChange: (s: ReaderSettings) => void
}

const FONT_SIZES = [14, 16, 18, 20, 22]
const LINE_HEIGHTS = [
  { label: '紧', value: 1.6 },
  { label: '标准', value: 1.85 },
  { label: '宽', value: 2.1 },
]
const BG_COLORS = [
  { label: '白', color: '#FFFFFF' },
  { label: '米黄', color: '#F5E6C8' },
  { label: '护眼', color: '#C7EDCC' },
  { label: '深灰', color: '#2A2A2A' },
  { label: '纯黑', color: '#000000' },
]

export default function SettingsSheet({ open, onClose, settings, onChange }: Props) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="settings-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
          zIndex: 41,
          animation: 'slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        }}
      >
        {/* 字号 */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>字号</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {FONT_SIZES.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...settings, fontSize: size })}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  background: settings.fontSize === size ? 'var(--accent-100)' : 'var(--bg-elevated)',
                  color: settings.fontSize === size ? 'var(--accent-400)' : 'var(--text-secondary)',
                  fontWeight: settings.fontSize === size ? 600 : 400,
                  transition: 'background 200ms, color 200ms',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 背景 */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>背景</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {BG_COLORS.map(({ label, color }) => (
              <button
                key={color}
                type="button"
                title={label}
                onClick={() => onChange({ ...settings, bgColor: color })}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: color,
                  border: settings.bgColor === color ? '2px solid var(--accent-500)' : '2px solid transparent',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* 行距 */}
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>行距</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {LINE_HEIGHTS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...settings, lineHeight: value })}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  background: settings.lineHeight === value ? 'var(--accent-100)' : 'var(--bg-elevated)',
                  color: settings.lineHeight === value ? 'var(--accent-400)' : 'var(--text-secondary)',
                  fontWeight: settings.lineHeight === value ? 600 : 400,
                  transition: 'background 200ms, color 200ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
