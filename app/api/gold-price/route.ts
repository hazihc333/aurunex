import { NextRequest, NextResponse } from 'next/server'
import { getGoldPrice, setGoldPrice } from '@/app/lib/db'
import { refreshGoldPriceNow, startGoldPriceCron } from '@/app/lib/cron'

// Start cron when this module is first loaded
startGoldPriceCron()

export async function GET() {
  try {
    const data = getGoldPrice()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Manual price override
    if (typeof body.price_per_gram === 'number' && body.price_per_gram > 0) {
      setGoldPrice(body.price_per_gram)
      return NextResponse.json({ success: true, data: getGoldPrice() })
    }

    // Refresh from mock API
    if (body.refresh === true) {
      const newPrice = await refreshGoldPriceNow()
      return NextResponse.json({ success: true, data: getGoldPrice(), fetched: newPrice })
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
