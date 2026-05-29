'use client'

import { useState } from 'react'
import FriendRequestCard from './FriendRequestCard'

interface RequestUser {
  id: string
  username: string
  avatarUrl?: string | null
}

interface FriendRequest {
  id: string
  requesterId: string
  requester: RequestUser
}

interface FriendRequestsSectionProps {
  initialRequests: FriendRequest[]
}

export default function FriendRequestsSection({ initialRequests }: FriendRequestsSectionProps) {
  const [requests, setRequests] = useState(initialRequests)

  if (requests.length === 0) return null

  async function handleAction(requesterId: string, action: 'accept' | 'reject') {
    try {
      const res = await fetch(`/api/friends/${requesterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.requesterId !== requesterId))
      }
    } catch {
      // silently fail
    }
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2
        style={{
          margin: '0 0 12px',
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
        }}
      >
        好友请求{' '}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-muted)',
          }}
        >
          ({requests.length})
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {requests.map((req) => (
          <FriendRequestCard
            key={req.id}
            requester={req.requester}
            onAccept={() => handleAction(req.requesterId, 'accept')}
            onReject={() => handleAction(req.requesterId, 'reject')}
          />
        ))}
      </div>
    </section>
  )
}
