'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Client {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      const data = await res.json()
      if (data.success) setClients(data.data)
      else router.push('/')
    } catch {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name || !email || !password) { setError('Completa todos los campos'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setClients(prev => [data.data, ...prev])
      setSuccess(`Cliente creado. Email: ${email} / Contraseña: ${password}`)
      setName(''); setEmail(''); setPassword('')
      setShowForm(false)
    } catch {
      setError('Error al crear cliente')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>Cargando...</span>
    </div>
  )

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">💍</div>
            <div>
              <div className="logo-text">Aurunex</div>
              <div className="logo-sub">Panel de Administrador</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')}>
              📊 Dashboard
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div className="page-header">
          <div>
            <div className="page-title">Clientes</div>
            <div className="page-subtitle">{clients.filter(c => c.role !== 'admin').length} joyerías registradas</div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}>
            ＋ Nuevo Cliente
          </button>
        </div>

        {/* Formulario nuevo cliente */}
        {showForm && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem'
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--ink)' }}>
              Nueva Joyería
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre de la joyería</label>
                <input className="form-input" type="text" placeholder="Joyería El Diamante" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input className="form-input" type="email" placeholder="contacto@joyeria.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña inicial</label>
                <input className="form-input" type="text" placeholder="contraseña123" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            {error && (
              <div style={{ background: 'var(--danger-soft)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius)', padding: '0.6rem 0.85rem', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--danger)', marginTop: '1rem' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-gold" onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div style={{
            background: 'var(--success-soft)', border: '1px solid rgba(30,107,60,0.2)',
            borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem',
            fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--success)'
          }}>
            ✓ {success}
          </div>
        )}

        {/* Lista de clientes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clients.filter(c => c.role !== 'admin').length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <h3>Sin clientes todavía</h3>
              <p>Agrega tu primera joyería para comenzar</p>
            </div>
          ) : (
            clients.filter(c => c.role !== 'admin').map(client => (
              <div key={client.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)' }}>
                    {client.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                    {client.email} · Registrado: {new Date(client.created_at).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div style={{
                  background: client.active ? 'var(--success-soft)' : 'var(--danger-soft)',
                  color: client.active ? 'var(--success)' : 'var(--danger)',
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px'
                }}>
                  {client.active ? 'Activo' : 'Inactivo'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}