'use client'

import { useState } from 'react'
import EditProfileForm from './EditProfileForm'

interface ProfileEditToggleProps {
  initialUsername: string
  initialBio: string | null
}

export default function ProfileEditToggle({ initialUsername, initialBio }: ProfileEditToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          background: isOpen ? 'var(--bg-elevated)' : 'transparent',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          borderRadius: '10px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background 200ms',
        }}
      >
        {isOpen ? '取消' : '编辑资料'}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <EditProfileForm
            initialUsername={initialUsername}
            initialBio={initialBio}
            onSave={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
