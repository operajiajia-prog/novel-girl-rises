import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TabBar from '@/components/nav/TabBar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>
      <TabBar />
    </div>
  )
}
