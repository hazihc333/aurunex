import { NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false }, { status: 401 })
    return NextResponse.json({ success: true, user: session })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}