import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS gold_price (id INTEGER PRIMARY KEY, price_per_gram FLOAT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
    await sql`INSERT INTO gold_price (id, price_per_gram) VALUES (1, 160.0) ON CONFLICT (id) DO NOTHING`
    const rows = await sql`SELECT price_per_gram, updated_at FROM gold_price WHERE id = 1`
    const row = rows[0]
    return NextResponse.json({ 
      success: true, 
      data: { 
        price_per_gram: Number(row.price_per_gram), 
        updated_at: new Date(row.updated_at as string).toISOString() 
      } 
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (typeof body.price_per_gram === 'number' && body.price_per_gram > 0) {
      await sql`UPDATE gold_price SET price_per_gram = ${body.price_per_gram}, updated_at = NOW() WHERE id = 1`
      const rows = await sql`SELECT price_per_gram, updated_at FROM gold_price WHERE id = 1`
      const row = rows[0]
      return NextResponse.json({ success: true, data: { price_per_gram: Number(row.price_per_gram), updated_at: new Date(row.updated_at as string).toISOString() } })
    }
    if (body.refresh === true) {
     const res = await fetch('https://gold-api.com/price/XAU')
     const data = await res.json()
     const ozPrice = data?.price ?? 3200
     const newPrice = parseFloat((ozPrice / 31.1035).toFixed(2))
      await sql`UPDATE gold_price SET price_per_gram = ${newPrice}, updated_at = NOW() WHERE id = 1`
      const rows = await sql`SELECT price_per_gram, updated_at FROM gold_price WHERE id = 1`
      const row = rows[0]
      return NextResponse.json({ success: true, data: { price_per_gram: Number(row.price_per_gram), updated_at: new Date(row.updated_at as string).toISOString() } })
    }
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}