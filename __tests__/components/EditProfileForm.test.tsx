import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import EditProfileForm from '@/components/profile/EditProfileForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

describe('EditProfileForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders with initial values', () => {
    render(
      <EditProfileForm
        initialUsername="alice"
        initialBio="Hello world"
      />
    )
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument()
  })

  it('shows character count for bio', () => {
    render(
      <EditProfileForm
        initialUsername="alice"
        initialBio="Hello world"
      />
    )
    // "Hello world" is 11 chars
    expect(screen.getByText('11/140')).toBeInTheDocument()
  })

  it('shows validation error for invalid username', async () => {
    render(
      <EditProfileForm
        initialUsername="alice"
        initialBio={null}
      />
    )
    const usernameInput = screen.getByDisplayValue('alice')
    await userEvent.clear(usernameInput)
    await userEvent.type(usernameInput, 'ab')
    await userEvent.click(screen.getByRole('button', { name: /保存/i }))
    await waitFor(() => {
      expect(screen.getByText(/用户名格式/i)).toBeInTheDocument()
    })
  })

  it('calls onSave after successful submit', async () => {
    const onSave = vi.fn()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ username: 'alice_new', bio: 'Updated bio' }),
    } as Response)

    render(
      <EditProfileForm
        initialUsername="alice"
        initialBio="Bio"
        onSave={onSave}
      />
    )

    const usernameInput = screen.getByDisplayValue('alice')
    await userEvent.clear(usernameInput)
    await userEvent.type(usernameInput, 'alice_new')
    await userEvent.click(screen.getByRole('button', { name: /保存/i }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })
})
