'use client'

import type { BookStatus } from '@/types'

interface FilterPillsProps {
  active: BookStatus | 'ALL'
  onChange: (status: BookStatus | 'ALL') => void
}

const OPTIONS: { value: BookStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',      label: '全部' },
  { value: 'READING',  label: '在读' },
  { value: 'WANT',     label: '想读' },
  { value: 'FINISHED', label: '已读' },
]

export default function FilterPills({ active, onChange }: FilterPillsProps) {
  return (
    <div
      className="scrollbar-none"
      style={{
        display: 'flex',
        overflowX: 'auto',
        paddingLeft: '16px',
        paddingRight: '16px',
        gap: '8px',
      }}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === active
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              height: '32px',
              padding: '6px 16px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              background: isActive ? 'var(--accent-500)' : 'var(--bg-elevated)',
              color: isActive ? 'var(--color-primary-foreground)' : 'var(--text-secondary)',
              transition: 'background 200ms, color 200ms',
              fontSize: '14px',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
