export type { Chapter } from './chapters'
export type { TxtMetadata } from './metadata'
export { detectEncoding, decodeBuffer } from './encoding'
export { parseChapters } from './chapters'
export { extractMetadata } from './metadata'

import { detectEncoding, decodeBuffer } from './encoding'
import { parseChapters } from './chapters'
import { extractMetadata } from './metadata'
import type { Chapter } from './chapters'

export interface TxtParseResult {
  title: string
  author: string | null
  encoding: string
  chapterCount: number
  chapters: Chapter[]
  fullText: string
}

export function parseTxtFile(buffer: Buffer, filename: string): TxtParseResult {
  const encoding = detectEncoding(buffer)
  const fullText = decodeBuffer(buffer, encoding)

  // Use first 500 chars as header for metadata extraction
  const headerText = fullText.slice(0, 500)
  const metadata = extractMetadata(filename, headerText)

  const chapters = parseChapters(fullText)

  return {
    title: metadata.title,
    author: metadata.author,
    encoding,
    chapterCount: chapters.length,
    chapters,
    fullText,
  }
}
