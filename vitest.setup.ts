import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock next/image to render a plain <img> for tests
vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    const { fill: _fill, ...imgProps } = props
    return React.createElement('img', imgProps)
  },
}))
