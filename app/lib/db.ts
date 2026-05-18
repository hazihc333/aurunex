import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function initDb() {
  await sql`CREATE TABLE IF NOT EXISTS gold_price (id INTEGER PRIMARY KEY DEFAULT 1, price_per_gram REAL NOT NULL DEFAULT 95.0, updated_at TEXT NOT NULL DEFAULT NOW()::text)`
  await sql`INSERT INTO gold_price (id, price_per_gram, updated_at) VALUES (1, 95.0, NOW()::text) ON CONFLICT (id) DO NOTHING`
  await sql`CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, grams REAL NOT NULL, karat INTEGER NOT NULL, labor_cost REAL NOT NULL DEFAULT 0, margin_percent REAL NOT NULL DEFAULT 0, extras REAL NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL DEFAULT NOW()::text, updated_at TEXT NOT NULL DEFAULT NOW()::text)`
}

export interface Product {
  id: number; name: string; grams: number; karat: 10 | 14 | 18 | 24
  labor_cost: number; margin_percent: number; extras: number
  notes: string | null; created_at: string; updated_at: string
}

export async function getGoldPrice() {
  await initDb()
  const rows = await sql`SELECT price_per_gram, updated_at FROM gold_price WHERE id = 1`
  return rows[0] as { price_per_gram: number; updated_at: string }
}

export async function setGoldPrice(price: number) {
  await initDb()
  await sql`UPDATE gold_price SET price_per_gram = ${price}, updated_at = NOW()::text WHERE id = 1`
}

export async function getAllProducts(): Promise<Product[]> {
  await initDb()
  return await sql`SELECT * FROM products ORDER BY created_at DESC` as Product[]
}

export async function getProductById(id: number): Promise<Product | undefined> {
  await initDb()
  const rows = await sql`SELECT * FROM products WHERE id = ${id}`
  return rows[0] as Product | undefined
}

export async function createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  await initDb()
  const rows = await sql`INSERT INTO products (name, grams, karat, labor_cost, margin_percent, extras, notes) VALUES (${data.name}, ${data.grams}, ${data.karat}, ${data.labor_cost}, ${data.margin_percent}, ${data.extras}, ${data.notes ?? null}) RETURNING *`
  return rows[0] as Product
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<Product | undefined> {
  await initDb()
  const existing = await getProductById(id)
  if (!existing) return undefined
  const m = { ...existing, ...data }
  const rows = await sql`UPDATE products SET name=${m.name}, grams=${m.grams}, karat=${m.karat}, labor_cost=${m.labor_cost}, margin_percent=${m.margin_percent}, extras=${m.extras}, notes=${m.notes}, updated_at=NOW()::text WHERE id=${id} RETURNING *`
  return rows[0] as Product
}

export async function deleteProduct(id: number): Promise<boolean> {
  await initDb()
  const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`
  return rows.length > 0
}