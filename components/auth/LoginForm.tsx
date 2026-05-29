'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
  password: z.string().min(1, '请输入密码'),
})

type FormData = z.infer<typeof schema>

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<string | null>(null)
  const justRegistered = searchParams.get('registered') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (!result?.ok) {
      setAuthError('邮箱或密码错误')
      return
    }
    router.push('/library')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {justRegistered && (
        <div
          className="text-sm text-center px-3 py-2"
          style={{
            background: 'rgba(74, 222, 128, 0.08)',
            color: 'var(--color-success)',
            border: '1px solid rgba(74, 222, 128, 0.18)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          注册成功！请登录
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="login-email"
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          邮箱
        </Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...register('email')}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            height: '48px',
            fontSize: '16px',
          }}
        />
        {errors.email && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="login-password"
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          密码
        </Label>
        <Input
          id="login-password"
          type="password"
          placeholder="你的密码"
          autoComplete="current-password"
          {...register('password')}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            height: '48px',
            fontSize: '16px',
          }}
        />
        {errors.password && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
            {errors.password.message}
          </p>
        )}
      </div>

      {authError && (
        <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>
          {authError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full font-semibold"
        style={{
          background: isSubmitting ? 'var(--bg-elevated)' : 'var(--accent-500)',
          color: 'var(--color-primary-foreground)',
          borderRadius: 'var(--radius-md)',
          height: '50px',
          fontSize: '15px',
          border: 'none',
          transition: 'background 200ms',
        }}
      >
        {isSubmitting ? '登录中…' : '登录'}
      </Button>
    </form>
  )
}
