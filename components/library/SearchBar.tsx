'use client'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Search icon */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '12px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          color: 'var(--text-disabled)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="6.5"
            cy="6.5"
            r="4.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="10.354"
            y1="10.354"
            x2="14"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <style>{`
        .search-bar-input::placeholder {
          color: var(--text-disabled);
        }
        .search-bar-input:focus {
          outline: none;
          border-color: var(--accent-500);
        }
      `}</style>

      <input
        className="search-bar-input"
        type="text"
        placeholder="搜索书名或作者…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          fontSize: '16px',
          lineHeight: '1.4',
          padding: '9px 36px 9px 36px',
          background: 'var(--bg-elevated)',
          borderRadius: '10px',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
          boxSizing: 'border-box',
          transition: 'border-color 150ms',
        }}
      />

      {/* Clear button — only visible when value is non-empty */}
      {value.length > 0 && (
        <button
          type="button"
          aria-label="clear"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: 'var(--text-disabled)',
            color: 'var(--color-primary-foreground)',
            fontSize: '14px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
