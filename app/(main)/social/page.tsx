export default function SocialPage() {
  return (
    <div className="px-4 pt-12 pb-6">
      <h1
        className="font-serif text-2xl font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        社群
      </h1>

      <div
        className="flex flex-col items-center justify-center py-20 text-center space-y-3"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.4 }}
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          还没有好友动态
        </p>
        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
          添加好友后，即可看到她们的书单和在读状态
        </p>
      </div>
    </div>
  )
}
