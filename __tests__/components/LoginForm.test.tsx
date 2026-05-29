import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import LoginForm from '@/components/auth/LoginForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

import { signIn } from 'next-auth/react'

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument()
  })

  it('shows validation error for empty submit', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: /登录/i }))
    await waitFor(() => {
      expect(screen.getByText(/请输入有效邮箱/i)).toBeInTheDocument()
    })
  })

  it('calls signIn with credentials on valid submit', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({ error: null, ok: true, status: 200 } as never)

    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /登录/i }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({ email: 'a@b.com', password: 'password123' })
      )
    })
  })

  it('shows error message on invalid credentials', async () => {
    vi.mocked(signIn).mockResolvedValueOnce({ error: 'CredentialsSignin', ok: false, status: 401 } as never)

    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/密码/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /登录/i }))

    await waitFor(() => {
      expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument()
    })
  })
})
