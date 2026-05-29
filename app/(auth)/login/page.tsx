import { Suspense } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm space-y-8">

        <div className="text-center space-y-2">
          <h1
            className="font-serif text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            崛起吧小说妹
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            登录你的书库
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          没有账号？{' '}
          <Link
            href="/register"
            className="font-medium transition-colors"
            style={{ color: 'var(--accent-400)' }}
          >
            免费注册
          </Link>
        </p>

      </div>
    </div>
  )
}
