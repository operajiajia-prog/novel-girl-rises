'use client'

import { useState } from 'react'
import AddFriendModal from './AddFriendModal'

export default function AddFriendButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        data-testid="add-friend-btn"
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 14px',
          borderRadius: '12px',
          border: 'none',
          background: 'var(--accent-500)',
          color: 'var(--color-primary-foreground)',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
        <span>添加</span>
      </button>

      {open && <AddFriendModal onClose={() => setOpen(false)} />}
    </>
  )
}
