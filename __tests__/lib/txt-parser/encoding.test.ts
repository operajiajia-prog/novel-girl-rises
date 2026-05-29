import { describe, it, expect } from 'vitest'
import { detectEncoding, decodeBuffer } from '@/lib/txt-parser/encoding'

describe('detectEncoding', () => {
  it('detects UTF-8 BOM', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf, 0x48, 0x65, 0x6c, 0x6c, 0x6f])
    const result = detectEncoding(bom)
    expect(result).toBe('UTF-8')
  })

  it('detects plain UTF-8 text', () => {
    const buf = Buffer.from('Hello World 你好世界', 'utf-8')
    const result = detectEncoding(buf)
    expect(result).toMatch(/UTF-8/i)
  })

  it('falls back to UTF-8 for empty buffer', () => {
    const result = detectEncoding(Buffer.alloc(0))
    expect(result).toBe('UTF-8')
  })
})

describe('decodeBuffer', () => {
  it('decodes UTF-8 correctly', () => {
    const buf = Buffer.from('你好世界', 'utf-8')
    const result = decodeBuffer(buf, 'UTF-8')
    expect(result).toBe('你好世界')
  })

  it('strips UTF-8 BOM when decoding', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf])
    const text = Buffer.from('Hello', 'utf-8')
    const buf = Buffer.concat([bom, text])
    const result = decodeBuffer(buf, 'UTF-8')
    expect(result).toBe('Hello')
  })

  it('auto-detects encoding when not provided', () => {
    const buf = Buffer.from('你好世界', 'utf-8')
    const result = decodeBuffer(buf)
    expect(result).toBe('你好世界')
  })
})
