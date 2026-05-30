'use client'

export interface ReaderSettings {
  fontSize: number
  bgColor: string
  lineHeight: number
  fontFamily: string       // default: 'system-ui, -apple-system, sans-serif'
  brightness: number       // range 0.7–1.0, default: 1.0
  paragraphSpacing: number // range 0–2 (em units), default: 0
}

interface Props {
  open: boolean
  onClose: () => void
  settings: ReaderSettings
  onChange: (s: ReaderSettings) => void
}

const FONT_SIZES = [14, 16, 18, 20, 22]
const FONT_FAMILIES = [
  { label: '默认', value: 'system-ui, -apple-system, sans-serif' },
  { label: '宋体', value: '"SimSun", "STSong", Georgia, serif' },
  { label: '楷体', value: '"KaiTi", "STKaiti", cursive' },
  { label: '黑体', value: '"SimHei", "STHeiti", "Microsoft YaHei", sans-serif' },
]
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
      {/* Backdrop — supports both click and touch */}
      <div
        data-testid="settings-backdrop"
        onClick={onClose}
        onTouchEnd={(e) => { e.preventDefault(); onClose(); }}
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
        <div style={{ marginBottom: '20px' }}>
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

        {/* 字体 */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>字体</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {FONT_FAMILIES.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ ...settings, fontFamily: f.value })}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: settings.fontFamily === f.value ? 'var(--accent-100)' : 'var(--bg-elevated)',
                  color: settings.fontFamily === f.value ? 'var(--accent-400)' : 'var(--text-secondary)',
                  fontWeight: settings.fontFamily === f.value ? 600 : 400,
                  fontFamily: f.value,
                  transition: 'background 200ms, color 200ms',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 亮度 */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>亮度</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>暗</span>
            <input
              data-testid="brightness-slider"
              type="range"
              aria-label="亮度"
              min={70}
              max={100}
              step={5}
              value={Math.round(settings.brightness * 100)}
              onChange={e => onChange({ ...settings, brightness: Number(e.target.value) / 100 })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>亮</span>
          </div>
        </div>

        {/* 段落间距 */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>段落间距</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>密</span>
            <input
              data-testid="paragraph-spacing-slider"
              type="range"
              aria-label="段落间距"
              min={0}
              max={20}
              step={2}
              value={Math.round(settings.paragraphSpacing * 10)}
              onChange={e => onChange({ ...settings, paragraphSpacing: Number(e.target.value) / 10 })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>疏</span>
          </div>
        </div>
      </div>
    </>
  )
}
