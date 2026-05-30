import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const VALID_BG_COLORS = ['light', 'sepia', 'green', 'dark', 'black']
const VALID_LINE_HEIGHTS = ['tight', 'normal', 'wide']

export async function GET(request: Request) {
  void request
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { readerFontSize: true, readerBgColor: true, readerLineHeight: true },
    })

    return NextResponse.json({
      fontSize: user?.readerFontSize ?? 17,
      bgColor: user?.readerBgColor ?? 'dark',
      lineHeight: user?.readerLineHeight ?? 'normal',
    })
  } catch (err) {
    console.error('GET /api/user/reader-prefs error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '未登录' }, { status: 401 })

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (body.fontSize !== undefined) {
      if (body.fontSize < 14 || body.fontSize > 22) {
        return NextResponse.json({ error: '字号范围 14-22' }, { status: 400 })
      }
      data.readerFontSize = body.fontSize
    }
    if (body.bgColor !== undefined) {
      if (!VALID_BG_COLORS.includes(body.bgColor)) {
        return NextResponse.json({ error: '无效背景色' }, { status: 400 })
      }
      data.readerBgColor = body.bgColor
    }
    if (body.lineHeight !== undefined) {
      if (!VALID_LINE_HEIGHTS.includes(body.lineHeight)) {
        return NextResponse.json({ error: '无效行距' }, { status: 400 })
      }
      data.readerLineHeight = body.lineHeight
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data,
      select: { readerFontSize: true, readerBgColor: true, readerLineHeight: true },
    })

    return NextResponse.json({
      fontSize: updated.readerFontSize,
      bgColor: updated.readerBgColor,
      lineHeight: updated.readerLineHeight,
    })
  } catch (err) {
    console.error('PATCH /api/user/reader-prefs error:', err)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
