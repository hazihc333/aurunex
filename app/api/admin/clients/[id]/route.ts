import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/app/lib/auth'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    const body = await req.json()
    const { name, email, password, active } = body

    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await sql`UPDATE clients SET name=${name}, email=${email}, password_hash=${hash}, active=${active}, updated_at=NOW() WHERE id=${Number(id)}`
    } else {
      await sql`UPDATE clients SET name=${name}, email=${email}, active=${active} WHERE id=${Number(id)}`
    }

    const rows = await sql`SELECT id, name, email, role, active, created_at FROM clients WHERE id=${Number(id)}`
    return NextResponse.json({ success: true, data: rows[0] })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    const { id } = await params
    await sql`UPDATE clients SET active=false WHERE id=${Number(id)}`
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}