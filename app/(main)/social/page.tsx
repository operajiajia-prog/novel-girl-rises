import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import AddFriendButton from '@/components/social/AddFriendButton'
import FriendRequestsSection from '@/components/social/FriendRequestsSection'
import FeedList from '@/components/social/FeedList'
import FriendCard from '@/components/social/FriendCard'

export default async function SocialPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  // Fetch all data in parallel
  const [pendingRequests, friendships] = await Promise.all([
    // 1. Pending friend requests where I am the addressee
    db.friendship.findMany({
      where: { addresseeId: userId, status: 'PENDING' },
      include: {
        requester: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // 2. Accepted friendships (both directions)
    db.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true } },
        addressee: { select: { id: true, username: true, avatarUrl: true } },
      },
    }),

  ])

  // Derive the list of friend user objects
  const friends = friendships.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester,
  )
  const friendIds = friends.map((f) => f.id)

  // Fetch activity feed for friends (limit 20)
  const feedItems = friendIds.length > 0
    ? await db.activityFeed.findMany({
        where: { userId: { in: friendIds } },
        include: {
          user: { select: { username: true, avatarUrl: true } },
          book: { select: { title: true, coverUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : []

  // Fetch currently-reading book for each friend
  const readingBooks = friendIds.length > 0
    ? await db.book.findMany({
        where: {
          userId: { in: friendIds },
          status: 'READING',
        },
        select: { userId: true, title: true },
      })
    : []

  const readingByUser: Record<string, { title: string }> = {}
  for (const book of readingBooks) {
    if (!readingByUser[book.userId]) {
      readingByUser[book.userId] = { title: book.title }
    }
  }

  // Serialize dates to strings for client components
  const serializedRequests = pendingRequests.map((r) => ({
    id: r.id,
    requesterId: r.requesterId,
    requester: r.requester,
  }))

  const serializedFeedItems = feedItems.map((item) => ({
    id: item.id,
    actionType: item.actionType as
      | 'BOOK_ADDED'
      | 'READING_STARTED'
      | 'BOOK_FINISHED'
      | 'BOOKLIST_UPDATED',
    createdAt: item.createdAt.toISOString(),
    user: item.user,
    book: item.book ?? null,
  }))

  return (
    <div className="space-y-0" style={{ paddingBottom: '32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
        }}
      >
        <h1
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          社群
        </h1>
        <AddFriendButton />
      </div>

      {/* Friend Requests (only shown when pending) */}
      <FriendRequestsSection initialRequests={serializedRequests} />

      {/* Activity Feed */}
      <section style={{ marginBottom: '32px' }}>
        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          好友动态
        </h2>
        <FeedList
          items={serializedFeedItems}
          emptyMessage={friendIds.length === 0 ? '去添加好友吧' : '暂无动态'}
        />
      </section>

      {/* Friends List */}
      <section>
        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          我的好友{' '}
          {friends.length > 0 && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-muted)',
              }}
            >
              ({friends.length})
            </span>
          )}
        </h2>

        {friends.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              padding: '32px 0',
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            还没有好友，去添加吧
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {friends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                readingBook={readingByUser[friend.id] ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
