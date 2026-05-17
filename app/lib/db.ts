import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

// ─── Types ─────────────────────────────────────────────────────────────────

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

interface DbSchema {
  gold_price: {
    price_per_gram: number
    updated_at: string
  }
  products: Product[]
  next_id: number
}

// ─── Read / Write ───────────────────────────────────────────────────────────

function readDb(): DbSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      gold_price: {
        price_per_gram: 95.0,
        updated_at: new Date().toISOString(),
      },
      products: [],
      next_id: 1,
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2))
    return initial
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DbSchema
}

function writeDb(data: DbSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

// ─── Gold Price ─────────────────────────────────────────────────────────────

export function getGoldPrice(): { price_per_gram: number; updated_at: string } {
  return readDb().gold_price
}

export function setGoldPrice(pricePerGram: number): void {
  const db = readDb()
  db.gold_price = {
    price_per_gram: pricePerGram,
    updated_at: new Date().toISOString(),
  }
  writeDb(db)
}

// ─── Products ───────────────────────────────────────────────────────────────

export function getAllProducts(): Product[] {
  return [...readDb().products].reverse()
}

export function getProductById(id: number): Product | undefined {
  return readDb().products.find(p => p.id === id)
}

export function createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
  const db = readDb()
  const now = new Date().toISOString()
  const product: Product = {
    ...data,
    id: db.next_id,
    created_at: now,
    updated_at: now,
  }
  db.products.push(product)
  db.next_id += 1
  writeDb(db)
  return product
}

export function updateProduct(
  id: number,
  data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Product | undefined {
  const db = readDb()
  const idx = db.products.findIndex(p => p.id === id)
  if (idx === -1) return undefined
  db.products[idx] = {
    ...db.products[idx],
    ...data,
    updated_at: new Date().toISOString(),
  }
  writeDb(db)
  return db.products[idx]
}

export function deleteProduct(id: number): boolean {
  const db = readDb()
  const before = db.products.length
  db.products = db.products.filter(p => p.id !== id)
  if (db.products.length === before) return false
  writeDb(db)
  return true
}
