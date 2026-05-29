export default function LibraryPage() {
  return (
    <div className="px-4 pt-12 pb-6">
      <h1
        className="font-serif text-2xl font-bold mb-6"
        style={{ color: 'var(--text-primary)' }}
      >
        我的书库
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
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          书库空空如也
        </p>
        <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
          上传 TXT 文件即可自动解析封面和分类
        </p>
      </div>
    </div>
  )
}
