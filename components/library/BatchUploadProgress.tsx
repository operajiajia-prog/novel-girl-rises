'use client'

interface BatchUploadProgressProps {
  total: number
  current: number
  currentFilename: string
  succeeded: number
  failed: number
}

export default function BatchUploadProgress({
  total,
  current,
  currentFilename,
  succeeded,
  failed,
}: BatchUploadProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          批量上传中 {current}/{total}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{pct}%</span>
      </div>

      <div style={{ height: '4px', background: 'var(--border-default)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-500)', transition: 'width 200ms ease' }} />
      </div>

      {currentFilename && (
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          正在上传：{currentFilename}
        </p>
      )}

      <div style={{ display: 'flex', gap: '16px' }}>
        {succeeded > 0 && (
          <span style={{ fontSize: '13px', color: 'var(--accent-600)' }}>✓ 成功 {succeeded}</span>
        )}
        {failed > 0 && (
          <span style={{ fontSize: '13px', color: 'var(--color-danger)' }}>✗ 失败 {failed}</span>
        )}
      </div>
    </div>
  )
}
