import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm space-y-8">

        {/* Brand header */}
        <div className="text-center space-y-2">
          <h1
            className="font-serif text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            崛起吧小说妹
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            创建你的书库
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6 space-y-2"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <RegisterForm />
        </div>

        {/* Login link */}
        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          已有账号？{' '}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: 'var(--accent-400)' }}
          >
            登录
          </Link>
        </p>

      </div>
    </div>
  )
}
