import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts, createProduct } from '@/app/lib/db'

export async function GET() {
  try {
    const products = getAllProducts()
    return NextResponse.json({ success: true, data: products })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { name, grams, karat, labor_cost, margin_percent, extras, notes } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }
    if (!grams || typeof grams !== 'number' || grams <= 0) {
      return NextResponse.json({ success: false, error: 'Los gramos deben ser un número positivo' }, { status: 400 })
    }
    if (![10, 14, 18, 24].includes(karat)) {
      return NextResponse.json({ success: false, error: 'Kilataje inválido' }, { status: 400 })
    }

    const product = createProduct({
      name: name.trim(),
      grams: Number(grams),
      karat: Number(karat) as 10 | 14 | 18 | 24,
      labor_cost: Number(labor_cost ?? 0),
      margin_percent: Number(margin_percent ?? 0),
      extras: Number(extras ?? 0),
      notes: notes?.trim() || null,
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
