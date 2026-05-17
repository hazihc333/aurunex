// ─── Karat Purity Map ──────────────────────────────────────────────────────

export const KARAT_PURITY: Record<number, number> = {
  24: 1.0,
  18: 0.75,
  14: 0.585,
  10: 0.417,
}

export const KARAT_LABELS: Record<number, string> = {
  24: '24k — Oro Puro (100%)',
  18: '18k — Oro (75%)',
  14: '14k — Oro (58.5%)',
  10: '10k — Oro (41.7%)',
}

// ─── Calculation ───────────────────────────────────────────────────────────

export interface PriceBreakdown {
  purity: number
  goldValue: number      // gramos * pureza * precio_oro
  laborCost: number
  extras: number
  subtotal: number       // goldValue + labor + extras
  marginAmount: number   // subtotal * margin%
  finalPrice: number     // subtotal * (1 + margin%)
}

export function calculatePrice(params: {
  grams: number
  karat: number
  goldPricePerGram: number
  laborCost: number
  marginPercent: number
  extras: number
}): PriceBreakdown {
  const { grams, karat, goldPricePerGram, laborCost, marginPercent, extras } = params

  const purity = KARAT_PURITY[karat] ?? 1.0
  const goldValue = grams * purity * goldPricePerGram
  const subtotal = goldValue + laborCost + extras
  const marginAmount = subtotal * (marginPercent / 100)
  const finalPrice = subtotal + marginAmount

  return {
    purity,
    goldValue,
    laborCost,
    extras,
    subtotal,
    marginAmount,
    finalPrice,
  }
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}
