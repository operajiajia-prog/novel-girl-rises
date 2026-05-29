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
})
