import { setGoldPrice, getGoldPrice } from './db'

// ─── Mock Gold Price Fetcher ────────────────────────────────────────────────
// In production, replace this with a real API call, e.g.:
// https://metals-api.com, https://goldapi.io, or similar

async function fetchGoldPriceFromAPI(): Promise<number> {
  // Simulate a realistic gold price with slight variation (~$95–105 USD/gram)
  // Real gold price fluctuates around this range (≈$3000/oz ÷ 31.1 g/oz ≈ $96/g)
  const base = 96.5
  const variation = (Math.random() - 0.5) * 4 // ±$2 variation
  return parseFloat((base + variation).toFixed(2))
}

// ─── Cron Job Setup ────────────────────────────────────────────────────────

let cronStarted = false

export async function startGoldPriceCron() {
  if (cronStarted) return
  cronStarted = true

  // Only import node-cron on server side
  const cron = await import('node-cron')

  console.log('[Cron] Gold price updater started — runs every Sunday at 00:00')

  // Run every Sunday at midnight
  cron.schedule('0 0 * * 0', async () => {
    try {
      const newPrice = await fetchGoldPriceFromAPI()
      setGoldPrice(newPrice)
      console.log(`[Cron] Gold price updated: $${newPrice}/g at ${new Date().toISOString()}`)
    } catch (err) {
      console.error('[Cron] Failed to update gold price:', err)
    }
  })
}

// ─── Manual Update (used by admin API) ────────────────────────────────────

export async function refreshGoldPriceNow(): Promise<number> {
  const newPrice = await fetchGoldPriceFromAPI()
  setGoldPrice(newPrice)
  return newPrice
}
