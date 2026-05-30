import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import AvatarUpload from '@/components/profile/AvatarUpload'
import StatsCard from '@/components/profile/StatsCard'
import ProfileEditToggle from '@/components/profile/ProfileEditToggle'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, email: true, bio: true, avatarUrl: true },
  })

  if (!user) {
    redirect('/login')
  }

  const books = await db.book.findMany({
    where: { userId: session.user.id },
    select: { status: true },
  })

  const totalBooks = books.length
  const readingBooks = books.filter((b) => b.status === 'READING').length
  const finishedBooks = books.filter((b) => b.status === 'FINISHED').length

  return (
    <div className="px-4 pt-12 pb-24" style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1
        className="font-serif text-2xl font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        我
      </h1>

      {/* Profile header */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <AvatarUpload
            currentAvatarUrl={user.avatarUrl}
            username={user.username}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              data-testid="profile-username"
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.username}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '13px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </p>
            {user.bio && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: '16px' }}>
        <StatsCard
          totalBooks={totalBooks}
          readingBooks={readingBooks}
          finishedBooks={finishedBooks}
        />
      </div>

      {/* Edit profile toggle */}
      <ProfileEditToggle
        initialUsername={user.username}
        initialBio={user.bio}
      />
    </div>
  )
}
