import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET ?? 'aurunex-secret-2026'

export async function initAuthDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  const admin = await sql`SELECT id FROM clients WHERE email = 'admin@aurunex.com'`
  if (admin.length === 0) {
    const hash = await bcrypt.hash('aurunex2026', 10)
    await sql`
      INSERT INTO clients (name, email, password_hash, role)
      VALUES ('Admin', 'admin@aurunex.com', ${hash}, 'admin')
    `
  }
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id)`
  await sql`
    CREATE TABLE IF NOT EXISTS client_gold_price (
      client_id INTEGER PRIMARY KEY REFERENCES clients(id),
      price_per_gram FLOAT NOT NULL DEFAULT 160.0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export interface SessionUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'client'
}

export async function loginUser(email: string, password: string): Promise<SessionUser | null> {
  await initAuthDb()
  const rows = await sql`SELECT * FROM clients WHERE email = ${email} AND active = true`
  if (!rows[0]) return null
  const user = rows[0] as Record<string, unknown>
  const valid = await bcrypt.compare(password, user.password_hash as string)
  if (!valid) return null
  return {
    id: Number(user.id),
    name: String(user.name),
    email: String(user.email),
    role: user.role as 'admin' | 'client',
  }
}

export function createToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('aurunex_token')?.value
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as SessionUser
  } catch {
    return null
  }
}

export interface Client {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
}

export async function getAllClients(): Promise<Client[]> {
  await initAuthDb()
  const rows = await sql`SELECT id, name, email, role, active, created_at FROM clients ORDER BY created_at DESC`
  return rows as Client[]
}

export async function createClient(name: string, email: string, password: string): Promise<Client> {
  await initAuthDb()
  const hash = await bcrypt.hash(password, 10)
  const rows = await sql`
    INSERT INTO clients (name, email, password_hash, role)
    VALUES (${name}, ${email}, ${hash}, 'client')
    RETURNING id, name, email, role, active, created_at
  `
  const client = rows[0] as Client
  await sql`
    INSERT INTO client_gold_price (client_id, price_per_gram)
    VALUES (${client.id}, 160.0)
    ON CONFLICT (client_id) DO NOTHING
  `
  return client
}