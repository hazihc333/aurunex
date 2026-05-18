import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

function toProduct(row: Record<string, unknown>) {
  return {
    id: Number(row.id), name: String(row.name), grams: Number(row.grams),
    karat: Number(row.karat), labor_cost: Number(row.labor_cost),
    margin_percent: Number(row.margin_percent), extras: Number(row.extras),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at), updated_at: String(row.updated_at),
  }
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const rows = await sql`SELECT * FROM products WHERE id = ${Number(id)}`
    if (!rows[0]) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ success: true, data: toProduct(rows[0] as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await sql`SELECT * FROM products WHERE id = ${Number(id)}`
    if (!existing[0]) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
    const e = toProduct(existing[0] as Record<string, unknown>)
    const m = { ...e, ...body }
    const rows = await sql`UPDATE products SET name=${m.name}, grams=${Number(m.grams)}, karat=${Number(m.karat)}, labor_cost=${Number(m.labor_cost)}, margin_percent=${Number(m.margin_percent)}, extras=${Number(m.extras)}, notes=${m.notes||null}, updated_at=NOW() WHERE id=${Number(id)} RETURNING *`
    return NextResponse.json({ success: true, data: toProduct(rows[0] as Record<string, unknown>) })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const rows = await sql`DELETE FROM products WHERE id = ${Number(id)} RETURNING id`
    if (!rows.length) return NextResponse.json({ success: false, error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}