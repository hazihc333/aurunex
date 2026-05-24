'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      router.push('/')
      router.refresh()
    } catch {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)', padding: '1rem'
    }}>
      <div style={{
        background: 'var(--ink)', border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 'var(--radius-lg)', padding: '2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, background: 'linear-gradient(135deg, var(--gold-mid), var(--gold-light))',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 1rem'
          }}>💍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold-light)', fontWeight: 500 }}>
            Aurunex
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--gold-mid)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>
            Calculador de Joyas
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-mid)', display: 'block', marginBottom: 6 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="joyeria@ejemplo.com"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 'var(--radius)', padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem', color: 'var(--gold-pale)', outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.67rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-mid)', display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 'var(--radius)', padding: '0.65rem 0.85rem', fontFamily: 'var(--font-mono)',
                fontSize: '0.9rem', color: 'var(--gold-pale)', outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: 'var(--radius)', padding: '0.6rem 0.85rem',
              fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#FAB8B2'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--gold-mid), var(--gold-light))',
              color: 'var(--ink)', border: 'none', borderRadius: 'var(--radius)',
              padding: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
              letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              marginTop: '0.5rem', width: '100%'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}