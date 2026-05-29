'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('请输入有效邮箱'),
  username: z
    .string()
    .min(2, '用户名至少 2 个字符')
    .max(30, '用户名最多 30 个字符')
    .regex(/^[\w一-龥]+$/, '只能包含字母、数字、下划线或中文'),
  password: z.string().min(8, '密码至少 8 位'),
})

type FormData = z.infer<typeof schema>

export default function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json()
      setServerError(body.error ?? '注册失败，请重试')
      return
    }
    router.push('/login?registered=1')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          邮箱
        </Label>
        <Input
          id="reg-email"
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
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-username" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          用户名
        </Label>
        <Input
          id="reg-username"
          placeholder="你的昵称"
          autoComplete="username"
          {...register('username')}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            height: '48px',
            fontSize: '16px',
          }}
        />
        {errors.username && (
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          密码
        </Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="至少 8 位"
          autoComplete="new-password"
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
          <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>{serverError}</p>
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
          transition: 'background 200ms, transform 150ms',
        }}
      >
        {isSubmitting ? '注册中…' : '创建账号'}
      </Button>
    </form>
  )
}
