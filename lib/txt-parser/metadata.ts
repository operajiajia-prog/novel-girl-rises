export interface TxtMetadata {
  title: string
  author: string | null
}

export function extractMetadata(filename: string, headerText: string): TxtMetadata {
  // Strip directory path and extension
  const basename = filename.replace(/^.*[\\/]/, '').replace(/\.txt$/i, '')

  // Parse filename: "书名 作者" or just "书名"
  const parts = basename.split(' ')
  let titleFromFile = parts[0].trim()
  let authorFromFile: string | null = parts.length >= 2 ? parts.slice(1).join(' ').trim() || null : null

  // Only look at first 500 chars of headerText
  const header = headerText.slice(0, 500)

  // Try to find 书名：XXX in header
  const titleMatch = header.match(/书名[：:]\s*(.+?)(?:[\n\r]|$)/)
  const titleFromHeader = titleMatch ? titleMatch[1].trim() : null

  // Try to find 作者：XXX in header
  const authorMatch = header.match(/作者[：:]\s*(.+?)(?:[\n\r]|$)/)
  const authorFromHeader = authorMatch ? authorMatch[1].trim() : null

  const title = titleFromHeader ?? titleFromFile
  const author = authorFromHeader ?? authorFromFile

  return {
    title,
    author: author || null,
  }
}
