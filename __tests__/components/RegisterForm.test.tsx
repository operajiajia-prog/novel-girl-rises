import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import RegisterForm from '@/components/auth/RegisterForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

global.fetch = vi.fn()

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation error for invalid email', async () => {
    render(<RegisterForm />)
    await userEvent.click(screen.getByRole('button', { name: /创建账号|注册/i }))
    await waitFor(() => {
      expect(screen.getByText(/请输入有效邮箱/i)).toBeInTheDocument()
    })
  })

  it('calls /api/register on valid submit', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', email: 'a@b.com', username: 'testuser' } }),
    } as Response)

    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/用户名/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  it('shows server error on 409 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: '邮箱已被注册' }),
    } as Response)

    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/用户名/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('邮箱已被注册')).toBeInTheDocument()
    })
  })

  it('shows 注册中… while submitting (loading state)', async () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}) as any)

    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/用户名/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('注册中…')).toBeInTheDocument()
    })
    expect(screen.getByText('注册中…').closest('button')).toBeDisabled()
  })

  it('shows fallback error when server response has no error field', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/用户名/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/注册失败/i)).toBeInTheDocument()
    })
  })

  it('shows short username validation error', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText(/邮箱/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/用户名/i), 'x')
    await userEvent.type(screen.getByLabelText(/密码/i), 'password123')
    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/用户名至少/i)).toBeInTheDocument()
    })
  })
})
