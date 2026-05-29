import { auth, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function Navbar() {
  const session = await auth()

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4"
      style={{
        height: '52px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span
        className="font-serif font-bold text-base tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        崛起吧小说妹
      </span>

      {session?.user && (
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {session.user.name}
          </span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/login' })
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-xs h-7 px-2"
              style={{ color: 'var(--text-muted)' }}
            >
              退出
            </Button>
          </form>
        </div>
      )}
    </header>
  )
}
