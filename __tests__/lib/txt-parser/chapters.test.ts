import { describe, it, expect } from 'vitest'
import { parseChapters } from '@/lib/txt-parser/chapters'

describe('parseChapters', () => {
  it('parses 第N章 pattern with Chinese number', () => {
    const text = '第一章 开始\n这是第一章内容\n第二章 发展\n这是第二章内容'
    const chapters = parseChapters(text)
    expect(chapters).toHaveLength(2)
    expect(chapters[0].title).toBe('第一章 开始')
    expect(chapters[1].title).toBe('第二章 发展')
  })

  it('parses 第N章 with Arabic digits', () => {
    const text = '第1章 起点\n内容一\n第2章 高潮\n内容二'
    const chapters = parseChapters(text)
    expect(chapters).toHaveLength(2)
    expect(chapters[0].title).toBe('第1章 起点')
    expect(chapters[1].title).toBe('第2章 高潮')
  })

  it('returns single chapter for text without chapter markers', () => {
    const text = '这是一段没有章节的正文内容。'
    const chapters = parseChapters(text)
    expect(chapters).toHaveLength(1)
    expect(chapters[0].index).toBe(0)
    expect(chapters[0].title).toBe('正文')
    expect(chapters[0].charOffset).toBe(0)
    expect(chapters[0].content).toBe(text)
  })

  it('captures content between chapters', () => {
    const text = '第一章 开始\n这是开始\n第二章 结束\n这是结束'
    const chapters = parseChapters(text)
    expect(chapters[0].content).toContain('这是开始')
    expect(chapters[0].content).not.toContain('这是结束')
    expect(chapters[1].content).toContain('这是结束')
  })

  it('returns charOffset for each chapter', () => {
    const text = '第一章 开始\n内容\n第二章 发展\n更多内容'
    const chapters = parseChapters(text)
    expect(chapters[0].charOffset).toBe(0)
    // Second chapter starts after first chapter and its content
    expect(chapters[1].charOffset).toBeGreaterThan(0)
  })

  it('parses 第N节 pattern', () => {
    const text = '第一节 节一\n内容\n第二节 节二\n内容'
    const chapters = parseChapters(text)
    expect(chapters).toHaveLength(2)
    expect(chapters[0].title).toBe('第一节 节一')
  })

  it('parses 第N回 pattern', () => {
    const text = '第3回 回三\n内容\n第4回 回四\n内容'
    const chapters = parseChapters(text)
    expect(chapters).toHaveLength(2)
    expect(chapters[0].title).toBe('第3回 回三')
  })

  it('assigns sequential index to each chapter', () => {
    const text = '第一章 开始\n内容\n第二章 发展\n内容\n第三章 结局\n内容'
    const chapters = parseChapters(text)
    expect(chapters[0].index).toBe(0)
    expect(chapters[1].index).toBe(1)
    expect(chapters[2].index).toBe(2)
  })
})
