import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import RecommendModal from '@/components/books/RecommendModal'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}))

global.fetch = vi.fn()

const mockFriends = [
  { id: 'u2', username: 'bob', avatarUrl: null },
  { id: 'u3', username: 'carol', avatarUrl: 'https://example.com/carol.png' },
]

describe('RecommendModal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('open=false 时不渲染', () => {
    render(
      <RecommendModal
        open={false}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )
    expect(screen.queryByText('推荐给好友')).not.toBeInTheDocument()
  })

  it('加载好友列表', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ friends: mockFriends }),
    } as any)

    render(
      <RecommendModal
        open={true}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )

    expect(screen.getByText('推荐给好友')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument()
      expect(screen.getByText('carol')).toBeInTheDocument()
    })
  })

  it('点击好友发起推荐（fetch POST called correctly）', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ friends: mockFriends }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as any)

    render(
      <RecommendModal
        open={true}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )

    await waitFor(() => expect(screen.getByText('bob')).toBeInTheDocument())

    await userEvent.click(screen.getByText('bob').closest('button')!)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/books/book1/recommend',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ targetUserId: 'u2' }),
        })
      )
    })
  })

  it('推荐成功后显示 ✓ 标记', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ friends: mockFriends }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as any)

    render(
      <RecommendModal
        open={true}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )

    await waitFor(() => expect(screen.getByText('bob')).toBeInTheDocument())

    await userEvent.click(screen.getByText('bob').closest('button')!)

    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument()
    })
  })

  it('无好友时显示空态提示', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ friends: [] }),
    } as any)

    render(
      <RecommendModal
        open={true}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('还没有好友，先去添加好友吧')).toBeInTheDocument()
    })
  })

  it('loading 状态', async () => {
    // Never resolves → stays loading
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {}) as any)

    render(
      <RecommendModal
        open={true}
        onClose={vi.fn()}
        bookId="book1"
        bookTitle="斗破苍穹"
      />
    )

    // Skeleton rows visible
    const skeletons = screen.getAllByLabelText('加载中')
    expect(skeletons.length).toBe(3)
  })
})
