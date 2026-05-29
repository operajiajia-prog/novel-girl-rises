import { render, screen } from '@testing-library/react'
import StatsCard from '@/components/profile/StatsCard'

describe('StatsCard', () => {
  it('renders finished books count', () => {
    render(<StatsCard totalBooks={5} readingBooks={2} finishedBooks={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('已读')).toBeInTheDocument()
  })

  it('renders reading books count', () => {
    render(<StatsCard totalBooks={5} readingBooks={2} finishedBooks={3} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('在读')).toBeInTheDocument()
  })

  it('renders completion rate percentage (rounded)', () => {
    render(<StatsCard totalBooks={3} readingBooks={1} finishedBooks={2} />)
    // 2/3 * 100 = 66.67 → 67%
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('完成率')).toBeInTheDocument()
  })

  it('shows 0% when totalBooks is 0', () => {
    render(<StatsCard totalBooks={0} readingBooks={0} finishedBooks={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})
