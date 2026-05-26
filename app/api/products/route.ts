import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'
import { getSession, initAuthDb } from '@/app/lib/auth'

const sql = neon(process.env.DATABASE_URL!)

function toProduct(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: String(row.name),
    grams: Number(row.grams),
    karat: Number(row.karat),
    labor_cost: Number(row.labor_cost),
    margin_percent: Number(row.margin_percent),
    extras: Number(row.extras),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    await initAuthDb()
    const rows = session.role === 'admin'
      ? await sql`SELECT * FROM products ORDER BY created_at DESC`
      : await sql`SELECT * FROM products WHERE client_id = ${session.id} ORDER BY created_at DESC`
    return NextResponse.json({ success: true, data: rows.map(r => toProduct(r as Record<string, unknown>)) })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    await initAuthDb()
    const body = await req.json()
    const { name, grams, karat, labor_cost, margin_percent, extras, notes } = body
    if (!name || !grams || ![10,14,18,24].includes(karat)) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }
    const rows = await sql`
      INSERT INTO products (name, grams, karat, labor_cost, margin_percent, extras, notes, client_id)
      VALUES (${name.trim()}, ${Number(grams)}, ${Number(karat)}, ${Number(labor_cost??0)}, ${Number(margin_percent??0)}, ${Number(extras??0)}, ${notes?.trim()||null}, ${session.id})
      RETURNING *
    `
    return NextResponse.json({ success: true, data: toProduct(rows[0] as Record<string, unknown>) }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}