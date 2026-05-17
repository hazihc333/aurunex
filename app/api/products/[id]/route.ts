import { NextRequest, NextResponse } from 'next/server'
import { getProductById, updateProduct, deleteProduct } from '@/app/lib/db'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const product = getProductById(Number(id))
    if (!product) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await req.json()
    const product = updateProduct(Number(id), {
      name: body.name?.trim(),
      grams: body.grams !== undefined ? Number(body.grams) : undefined,
      karat: body.karat !== undefined ? Number(body.karat) as 10 | 14 | 18 | 24 : undefined,
      labor_cost: body.labor_cost !== undefined ? Number(body.labor_cost) : undefined,
      margin_percent: body.margin_percent !== undefined ? Number(body.margin_percent) : undefined,
      extras: body.extras !== undefined ? Number(body.extras) : undefined,
      notes: body.notes?.trim() || null,
    })
    if (!product) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true, data: product })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const deleted = deleteProduct(Number(id))
    if (!deleted) return NextResponse.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}