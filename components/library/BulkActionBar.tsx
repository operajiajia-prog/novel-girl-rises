'use client'

import type { BookStatus } from '@/types'

interface Props {
  selectedCount: number
  onStatusChange: (status: BookStatus) => void
  onArchive: () => void
  onDelete: () => void
  onCancel: () => void
}

export default function BulkActionBar({ selectedCount, onStatusChange, onArchive, onDelete, onCancel }: Props) {
  const handleDelete = () => {
    if (window.confirm(`确定删除所选 ${selectedCount} 本书籍？此操作不可撤销。`)) {
      onDelete()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '16px',
        right: '16px',
        background: 'var(--accent-950)',
        borderRadius: '16px',
        padding: '12px 16px',
        zIndex: 30,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top row: count + cancel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ color: 'var(--accent-400)', fontWeight: 600, fontSize: '14px' }}>
          已选 {selectedCount} 本
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px' }}
        >
          取消
        </button>
      </div>
      {/* Bottom row: actions */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['READING', 'WANT', 'FINISHED'] as BookStatus[]).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onStatusChange(s)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            {['在读', '想读', '已读'][i]}
          </button>
        ))}
        <button
          type="button"
          onClick={onArchive}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
          }}
        >
          归档
        </button>
        <button
          type="button"
          onClick={handleDelete}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
          }}
        >
          删除
        </button>
      </div>
    </div>
  )
}
