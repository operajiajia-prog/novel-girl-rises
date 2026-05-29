import { useMemo } from 'react'

interface StatsCardProps {
  totalBooks: number
  readingBooks: number
  finishedBooks: number
}

export default function StatsCard({ totalBooks, readingBooks, finishedBooks }: StatsCardProps) {
  const completionRate = useMemo(() => {
    if (totalBooks === 0) return 0
    return Math.round((finishedBooks / totalBooks) * 100)
  }, [finishedBooks, totalBooks])

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '20px 16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        textAlign: 'center',
      }}
    >
      {/* Finished books */}
      <div>
        <p
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", monospace',
            fontSize: '22px',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {finishedBooks}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0',
          }}
        >
          已读
        </p>
      </div>

      {/* Reading books */}
      <div>
        <p
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", monospace',
            fontSize: '22px',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {readingBooks}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0',
          }}
        >
          在读
        </p>
      </div>

      {/* Completion rate */}
      <div>
        <p
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", monospace',
            fontSize: '22px',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {completionRate}%
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '4px 0 0',
          }}
        >
          完成率
        </p>
      </div>
    </div>
  )
}
