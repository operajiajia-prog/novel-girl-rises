export interface Chapter {
  index: number
  title: string
  charOffset: number
  content: string
}

export function parseChapters(text: string): Chapter[] {
  const chapterRe = /^(第[零〇一二三四五六七八九十百千万\d]+[章节回篇卷][^\n]*)/gm
  const matches: { index: number; title: string; charOffset: number }[] = []

  let match: RegExpExecArray | null
  while ((match = chapterRe.exec(text)) !== null) {
    matches.push({
      index: matches.length,
      title: match[1].trim(),
      charOffset: match.index,
    })
  }

  if (matches.length === 0) {
    return [
      {
        index: 0,
        title: '正文',
        charOffset: 0,
        content: text,
      },
    ]
  }

  const chapters: Chapter[] = matches.map((m, i) => {
    const start = m.charOffset
    const end = i + 1 < matches.length ? matches[i + 1].charOffset : text.length
    const content = text.slice(start, end)
    return {
      index: m.index,
      title: m.title,
      charOffset: m.charOffset,
      content,
    }
  })

  return chapters
}
