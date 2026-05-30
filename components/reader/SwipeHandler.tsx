'use client'

import { useRef, useCallback } from 'react'

interface SwipeHandlerProps {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  children: React.ReactNode
  threshold?: number
}

export default function SwipeHandler({
  onSwipeLeft,
  onSwipeRight,
  children,
  threshold = 50,
}: SwipeHandlerProps) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.changedTouches[0].clientX
    startY.current = e.changedTouches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return
    const dx = e.changedTouches[0].clientX - startX.current
    const dy = e.changedTouches[0].clientY - startY.current
    startX.current = null
    startY.current = null

    if (Math.abs(dx) < threshold) return
    if (Math.abs(dy) >= Math.abs(dx)) return

    if (dx < 0) onSwipeLeft()
    else onSwipeRight()
  }, [onSwipeLeft, onSwipeRight, threshold])

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  )
}
