import { NextRequest, NextResponse } from 'next/server'
import { getSession, getAllClients, createClient } from '@/app/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    const clients = await getAllClients()
    return NextResponse.json({ success: true, data: clients })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Todos los campos son requeridos' }, { status: 400 })
    }
    const client = await createClient(name, email, password)
    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}