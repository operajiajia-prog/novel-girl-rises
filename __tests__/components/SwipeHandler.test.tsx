import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SwipeHandler from '@/components/reader/SwipeHandler'

function swipe(element: Element, dx: number, dy: number) {
  fireEvent.touchStart(element, { changedTouches: [{ clientX: 100, clientY: 100 }] })
  fireEvent.touchEnd(element, { changedTouches: [{ clientX: 100 + dx, clientY: 100 + dy }] })
}

describe('SwipeHandler', () => {
  it('calls onSwipeLeft when swiping left (>50px horizontal)', () => {
    const onLeft = vi.fn()
    render(<SwipeHandler onSwipeLeft={onLeft} onSwipeRight={vi.fn()}><div>content</div></SwipeHandler>)
    swipe(screen.getByText('content').parentElement!, -60, 5)
    expect(onLeft).toHaveBeenCalledOnce()
  })

  it('calls onSwipeRight when swiping right (>50px horizontal)', () => {
    const onRight = vi.fn()
    render(<SwipeHandler onSwipeLeft={vi.fn()} onSwipeRight={onRight}><div>content</div></SwipeHandler>)
    swipe(screen.getByText('content').parentElement!, 60, 5)
    expect(onRight).toHaveBeenCalledOnce()
  })

  it('does not fire when movement < threshold (50px)', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    render(<SwipeHandler onSwipeLeft={onLeft} onSwipeRight={onRight}><div>content</div></SwipeHandler>)
    swipe(screen.getByText('content').parentElement!, -30, 0)
    expect(onLeft).not.toHaveBeenCalled()
    expect(onRight).not.toHaveBeenCalled()
  })

  it('does not fire on vertical scroll (vertical >= horizontal)', () => {
    const onLeft = vi.fn()
    render(<SwipeHandler onSwipeLeft={onLeft} onSwipeRight={vi.fn()}><div>content</div></SwipeHandler>)
    swipe(screen.getByText('content').parentElement!, -60, 80)
    expect(onLeft).not.toHaveBeenCalled()
  })

  it('does not call both handlers for single swipe', () => {
    const onLeft = vi.fn()
    const onRight = vi.fn()
    render(<SwipeHandler onSwipeLeft={onLeft} onSwipeRight={onRight}><div>content</div></SwipeHandler>)
    swipe(screen.getByText('content').parentElement!, -60, 0)
    expect(onLeft).toHaveBeenCalledOnce()
    expect(onRight).not.toHaveBeenCalled()
  })

  it('renders children correctly', () => {
    render(
      <SwipeHandler onSwipeLeft={vi.fn()} onSwipeRight={vi.fn()}>
        <div data-testid="child">child content</div>
      </SwipeHandler>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('respects custom threshold prop', () => {
    const onLeft = vi.fn()
    render(
      <SwipeHandler onSwipeLeft={onLeft} onSwipeRight={vi.fn()} threshold={100}>
        <div>content</div>
      </SwipeHandler>
    )
    // 60px swipe should NOT fire when threshold is 100
    swipe(screen.getByText('content').parentElement!, -60, 5)
    expect(onLeft).not.toHaveBeenCalled()
  })
})
