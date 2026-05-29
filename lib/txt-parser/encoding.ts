import chardet from 'chardet'
import iconv from 'iconv-lite'

const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf])

export function detectEncoding(buffer: Buffer): string {
  if (buffer.length === 0) {
    return 'UTF-8'
  }

  // Check for UTF-8 BOM
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return 'UTF-8'
  }

  const detected = chardet.detect(buffer)
  if (!detected) {
    return 'UTF-8'
  }

  return detected
}

export function decodeBuffer(buffer: Buffer, encoding?: string): string {
  const enc = encoding ?? detectEncoding(buffer)

  let buf = buffer
  // Strip UTF-8 BOM if present
  if (
    buf.length >= 3 &&
    buf[0] === UTF8_BOM[0] &&
    buf[1] === UTF8_BOM[1] &&
    buf[2] === UTF8_BOM[2]
  ) {
    buf = buf.slice(3)
  }

  return iconv.decode(buf, enc)
}
