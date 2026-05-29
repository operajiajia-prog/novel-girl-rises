import { describe, it, expect } from 'vitest'
import { extractMetadata } from '@/lib/txt-parser/metadata'

describe('extractMetadata', () => {
  it('extracts title from simple filename without author', () => {
    const result = extractMetadata('斗破苍穹.txt', '')
    expect(result.title).toBe('斗破苍穹')
    expect(result.author).toBeNull()
  })

  it('extracts title and author from filename with space separator', () => {
    const result = extractMetadata('斗破苍穹 天蚕土豆.txt', '')
    expect(result.title).toBe('斗破苍穹')
    expect(result.author).toBe('天蚕土豆')
  })

  it('extracts author from file header with 作者：pattern', () => {
    const header = '书名：遮天\n作者：辰东\n\n第一章'
    const result = extractMetadata('遮天.txt', header)
    expect(result.author).toBe('辰东')
  })

  it('prefers header author over filename author', () => {
    const header = '作者：辰东'
    const result = extractMetadata('遮天 某作者.txt', header)
    expect(result.author).toBe('辰东')
  })

  it('extracts title from header with 书名：pattern', () => {
    const header = '书名：完美世界\n作者：辰东'
    const result = extractMetadata('unknown.txt', header)
    expect(result.title).toBe('完美世界')
  })

  it('returns null author when not found in filename or header', () => {
    const result = extractMetadata('未知小说.txt', '第一章 开始\n内容')
    expect(result.author).toBeNull()
  })

  it('handles filename without extension', () => {
    const result = extractMetadata('斗破苍穹', '')
    expect(result.title).toBe('斗破苍穹')
  })

  it('only reads first 500 chars of headerText for author detection', () => {
    const longPreamble = '内容'.repeat(300) // 600 chars
    const headerWithAuthor = longPreamble + '作者：迟来的人'
    const result = extractMetadata('test.txt', headerWithAuthor)
    // Author appears after 500 chars, should not be found from header
    expect(result.author).toBeNull()
  })
})
