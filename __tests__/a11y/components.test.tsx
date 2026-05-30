import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { expect, describe, it, vi } from 'vitest'

expect.extend(toHaveNoViolations)

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

// Disable color-contrast globally — CSS custom properties can't be evaluated by axe
const AXE_CONFIG = {
  rules: {
    'color-contrast': { enabled: false },
  },
}

// ─── BookCard ────────────────────────────────────────────────────────────────

import BookCard from '@/components/books/BookCard'

describe('Accessibility: BookCard', () => {
  it('has no a11y violations (no cover, READING status)', async () => {
    const { container } = render(
      <BookCard
        book={{
          id: 'book-1',
          title: '斗破苍穹',
          author: '天蚕土豆',
          coverUrl: null,
          genre: '玄幻',
          status: 'READING',
          chapterIndex: 30,
          chapterCount: 100,
        }}
      />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations (with cover URL, WANT status)', async () => {
    const { container } = render(
      <BookCard
        book={{
          id: 'book-2',
          title: '完美世界',
          coverUrl: 'https://example.com/cover.jpg',
          status: 'WANT',
        }}
      />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})

// ─── FilterPills ─────────────────────────────────────────────────────────────

import FilterPills from '@/components/library/FilterPills'

describe('Accessibility: FilterPills', () => {
  it('has no a11y violations', async () => {
    const { container } = render(
      <FilterPills active="ALL" onChange={vi.fn()} />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations when an option is active', async () => {
    const { container } = render(
      <FilterPills active="READING" onChange={vi.fn()} />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})

// ─── UploadZone ──────────────────────────────────────────────────────────────

import UploadZone from '@/components/books/UploadZone'

describe('Accessibility: UploadZone', () => {
  it('has no a11y violations in idle state', async () => {
    const { container } = render(
      <UploadZone onSuccess={vi.fn()} />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})

// ─── BookContextMenu ──────────────────────────────────────────────────────────

import BookContextMenu from '@/components/library/BookContextMenu'

describe('Accessibility: BookContextMenu', () => {
  it('has no a11y violations when menu is closed', async () => {
    const { container } = render(
      <BookContextMenu
        book={{ id: 'book-1', status: 'READING' }}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      >
        <div>Book content</div>
      </BookContextMenu>,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations when menu is open', async () => {
    const { container, getByRole } = render(
      <BookContextMenu
        book={{ id: 'book-1', status: 'READING' }}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      >
        <div>Book content</div>
      </BookContextMenu>,
    )

    // Trigger context menu to open it
    const wrapper = container.firstElementChild as HTMLElement
    wrapper?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))

    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})

// ─── SettingsSheet ────────────────────────────────────────────────────────────

import SettingsSheet, { ReaderSettings } from '@/components/reader/SettingsSheet'

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  bgColor: '#FFFFFF',
  lineHeight: 1.85,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  brightness: 1.0,
  paragraphSpacing: 0,
}

describe('Accessibility: SettingsSheet', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <SettingsSheet
        open={false}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onChange={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('has no a11y violations when open', async () => {
    const { container } = render(
      <SettingsSheet
        open={true}
        onClose={vi.fn()}
        settings={DEFAULT_SETTINGS}
        onChange={vi.fn()}
      />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})

// ─── SearchBar ────────────────────────────────────────────────────────────────

import SearchBar from '@/components/library/SearchBar'

describe('Accessibility: SearchBar', () => {
  it('has no a11y violations with empty value', async () => {
    const { container } = render(
      <SearchBar value="" onChange={vi.fn()} />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })

  it('has no a11y violations with a value (shows clear button)', async () => {
    const { container } = render(
      <SearchBar value="斗破" onChange={vi.fn()} />,
    )
    const results = await axe(container, AXE_CONFIG)
    expect(results).toHaveNoViolations()
  })
})
