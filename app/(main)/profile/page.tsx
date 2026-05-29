import { auth } from '@/lib/auth'

export default async function ProfilePage() {
  const session = await auth()

  return (
    <div className="px-4 pt-12 pb-6">
      <h1
        className="font-serif text-2xl font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        我
      </h1>

      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              background: 'var(--accent-950)',
              color: 'var(--accent-400)',
              border: '2px solid var(--border-default)',
            }}
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {session?.user?.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
