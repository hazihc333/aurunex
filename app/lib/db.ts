import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface Product {
  id: number
  name: string
  grams: number
  karat: 10 | 14 | 18 | 24
  labor_cost: number
  margin_percent: number
  extras: number
  notes: string | null
  created_at: string
  updated_at: string
}

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    grams: Number(row.grams),
    karat: Number(row.karat) as 10 | 14 | 18 | 24,
    labor_cost: Number(row.labor_cost),
    margin_percent: Number(row.margin_percent),
    extras: Number(row.extras),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function initDb() {
  await sql`CREATE TABLE IF NOT EXISTS gold_price (id INTEGER PRIMARY KEY DEFAULT 1, price_per_gram FLOAT NOT NULL DEFAULT 160.0, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`INSERT INTO gold_price (id, price_per_gram, updated_at) VALUES (1, 160.0, NOW()) ON CONFLICT (id) DO NOTHING`
  await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, grams FLOAT NOT NULL, karat INTEGER NOT NULL, labor_cost FLOAT NOT NULL DEFAULT 0, margin_percent FLOAT NOT NULL DEFAULT 0, extras FLOAT NOT NULL DEFAULT 0, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
}

export async function getGoldPrice(): Promise<{ price_per_gram: number; updated_at: string }> {
  await initDb()
  const rows = await sql`SELECT price_per_gram, updated_at FROM gold_price WHERE id = 1`
  const row = rows[0] as Record<string, unknown>
  return {
    price_per_gram: Number(row.price_per_gram),
    updated_at: new Date(row.updated_at as string).toISOString(),
  }
}

export async function setGoldPrice(price: number): Promise<void> {
  await initDb()
  await sql`UPDATE gold_price SET price_per_gram = ${price}, updated_at = NOW() WHERE id = 1`
}

export async function getAllProducts(): Promise<Product[]> {
  await initDb()
  const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`
  return rows.map(r => toProduct(r as Record<string, unknown>))
}

export async function getProductById(id: number): Promise<Product | undefined> {
  await initDb()
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`
  if (!rows[0]) return undefined
  return toProduct(rows[0] as Record<string, unknown>)
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  await initDb()
  const rows = await sql`INSERT INTO products (name, grams, karat, labor_cost, margin_percent, extras, notes) VALUES (${data.name}, ${data.grams}, ${data.karat}, ${data.labor_cost}, ${data.margin_percent}, ${data.extras}, ${data.notes ?? null}) RETURNING *`
  return toProduct(rows[0] as Record<string, unknown>)
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | undefined> {
  await initDb()
  const existing = await getProductById(id)
  if (!existing) return undefined
  const m = { ...existing, ...data }
  const rows = await sql`UPDATE products SET name=${m.name}, grams=${m.grams}, karat=${m.karat}, labor_cost=${m.labor_cost}, margin_percent=${m.margin_percent}, extras=${m.extras}, notes=${m.notes}, updated_at=NOW() WHERE id=${id} RETURNING *`
  return toProduct(rows[0] as Record<string, unknown>)
}

export async function deleteProduct(id: number): Promise<boolean> {
  await initDb()
  const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`
  return rows.length > 0
}