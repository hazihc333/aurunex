'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { calculatePrice, formatCurrency, KARAT_PURITY, KARAT_LABELS } from './lib/pricing'

interface Product {
  id: number
  name: string
  grams: number
  karat: 10 | 14 | 18 | 24
  labor_cost: number
  margin_percent: number
  extras: number
  notes: string | null
  client_name?: string | null
  created_at: string
}

interface GoldPrice {
  price_per_gram: number
  updated_at: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface FormData {
  name: string
  grams: string
  karat: string
  labor_cost: string
  margin_percent: string
  extras: string
  notes: string
}

const EMPTY_FORM: FormData = {
  name: '', grams: '', karat: '18',
  labor_cost: '', margin_percent: '', extras: '', notes: '',
}

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)
  const add = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, add }
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<{id: number, name: string}[]>([])
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [goldInputVal, setGoldInputVal] = useState('')
  const [updatingGold, setUpdatingGold] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const { toasts, add: addToast } = useToasts()

  const fetchAll = useCallback(async () => {
    try {
      const url = clientFilter !== 'all'
        ? `/api/products?client_id=${clientFilter}`
        : '/api/products'
      const [gRes, pRes, meRes] = await Promise.all([
        fetch('/api/gold-price'),
        fetch(url),
        fetch('/api/auth/me'),
      ])
      const [gData, pData, meData] = await Promise.all([gRes.json(), pRes.json(), meRes.json()])
      if (gData.success) {
        setGoldPrice(gData.data)
        setGoldInputVal(gData.data.price_per_gram.toString())
      }
      if (pData.success) setProducts(pData.data)
      if (meData.success) {
        setUserRole(meData.user.role)
        if (meData.user.role === 'admin') {
          const cRes = await fetch('/api/admin/clients')
          const cData = await cRes.json()
          if (cData.success) {
            setClients(cData.data.filter((c: {role: string}) => c.role !== 'admin'))
          }
        }
      }
    } catch {
      addToast('Error al cargar datos', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, clientFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const handleSetGoldPrice = async () => {
    const val = parseFloat(goldInputVal)
    if (isNaN(val) || val <= 0) { addToast('Ingresa un precio válido', 'error'); return }
    setUpdatingGold(true)
    try {
      const res = await fetch('/api/gold-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_per_gram: val }),
      })
      const data = await res.json()
      if (data.success) { setGoldPrice(data.data); addToast('Precio del oro actualizado', 'success') }
    } catch { addToast('Error al actualizar precio', 'error') }
    finally { setUpdatingGold(false) }
  }

  const handleRefreshGoldPrice = async () => {
    setUpdatingGold(true)
    try {
      const res = await fetch('/api/gold-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: true }),
      })
      const data = await res.json()
      if (data.success) {
        setGoldPrice(data.data)
        setGoldInputVal(data.data.price_per_gram.toString())
        addToast(`Precio actualizado: $${data.data.price_per_gram}/g`, 'success')
      }
    } catch { addToast('Error al actualizar precio', 'error') }
    finally { setUpdatingGold(false) }
  }

  const openAdd = () => { setEditingProduct(null); setForm(EMPTY_FORM); setShowModal(true) }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      grams: product.grams.toString(),
      karat: product.karat.toString(),
      labor_cost: product.labor_cost.toString(),
      margin_percent: product.margin_percent.toString(),
      extras: product.extras.toString(),
      notes: product.notes ?? '',
    })
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingProduct(null); setForm(EMPTY_FORM) }

  const handleSubmit = async () => {
    if (!form.name.trim()) { addToast('El nombre es requerido', 'error'); return }
    const grams = parseFloat(form.grams)
    if (isNaN(grams) || grams <= 0) { addToast('Gramos inválidos', 'error'); return }
    setSubmitting(true)
    const payload = {
      name: form.name.trim(), grams,
      karat: parseInt(form.karat),
      labor_cost: parseFloat(form.labor_cost) || 0,
      margin_percent: parseFloat(form.margin_percent) || 0,
      extras: parseFloat(form.extras) || 0,
      notes: form.notes.trim() || null,
    }
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? data.data : p))
        addToast('Producto actualizado', 'success')
      } else {
        setProducts(prev => [data.data, ...prev])
        addToast('Producto agregado', 'success')
      }
      closeModal()
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Error al guardar', 'error')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { setProducts(prev => prev.filter(p => p.id !== id)); addToast('Producto eliminado', 'info') }
    } catch { addToast('Error al eliminar', 'error') }
    finally { setDeletingId(null) }
  }

  const previewCalc = goldPrice && form.grams && parseFloat(form.grams) > 0
    ? calculatePrice({
        grams: parseFloat(form.grams) || 0,
        karat: parseInt(form.karat) || 18,
        goldPricePerGram: goldPrice.price_per_gram,
        laborCost: parseFloat(form.labor_cost) || 0,
        marginPercent: parseFloat(form.margin_percent) || 0,
        extras: parseFloat(form.extras) || 0,
      })
    : null

  const renderProductCard = (product: Product) => {
    if (!goldPrice) return null
    const calc = calculatePrice({
      grams: product.grams, karat: product.karat,
      goldPricePerGram: goldPrice.price_per_gram,
      laborCost: product.labor_cost,
      marginPercent: product.margin_percent,
      extras: product.extras,
    })
    return (
      <div key={product.id} className="product-card">
        <div className="product-card-header">
          {userRole === 'admin' && product.client_name && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--gold-mid)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              🏪 {product.client_name}
            </div>
          )}
          <div className="product-karat-badge">{product.karat}k · {(KARAT_PURITY[product.karat] * 100).toFixed(1)}% pureza</div>
          <div className="product-name">{product.name}</div>
        </div>
        <div className="product-card-body">
          <div className="product-specs">
            <div className="spec-item"><label>Gramos</label><span>{product.grams}g</span></div>
            <div className="spec-item"><label>Mano de obra</label><span>{formatCurrency(product.labor_cost)}</span></div>
            <div className="spec-item"><label>Margen</label><span>{product.margin_percent}%</span></div>
            <div className="spec-item"><label>Extras</label><span>{formatCurrency(product.extras)}</span></div>
          </div>
          {product.notes && <div className="notes-text">{product.notes}</div>}
          <div className="product-price-section">
            <div className="product-price-label">Precio Final de Venta</div>
            <div className="product-price-value">{formatCurrency(calc.finalPrice)}</div>
            <div className="product-breakdown">
              <div className="breakdown-row"><span>Valor oro</span><span>{formatCurrency(calc.goldValue)}</span></div>
              {calc.laborCost > 0 && <div className="breakdown-row"><span>Mano de obra</span><span>{formatCurrency(calc.laborCost)}</span></div>}
              {calc.extras > 0 && <div className="breakdown-row"><span>Extras</span><span>{formatCurrency(calc.extras)}</span></div>}
              {calc.marginAmount > 0 && <div className="breakdown-row"><span>Margen ({product.margin_percent}%)</span><span>{formatCurrency(calc.marginAmount)}</span></div>}
            </div>
          </div>
        </div>
        <div className="product-card-footer">
          <button className="btn btn-outline btn-sm" onClick={() => openEdit(product)}>✏️ Editar</button>
          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)} disabled={deletingId === product.id}>
            {deletingId === product.id ? <span className="spinner" /> : '🗑️'} Eliminar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>Cargando sistema...</span>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">💍</div>
            <div>
              <div className="logo-text">Aurunex</div>
              <div className="logo-sub">Calculador de Joyas</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {userRole === 'admin' && (
              <button className="btn btn-ghost btn-sm" onClick={() => window.location.href = '/admin'}>⚙️ Admin</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>🚪 Cerrar sesión</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2.5rem 2rem' }}>

        {goldPrice && (
          <div className="gold-banner">
            <div className="gold-banner-left">
              <div className="gold-orb">✨</div>
              <div className="gold-info">
                <label>Precio del Oro</label>
                <div className="gold-price-display">{formatCurrency(goldPrice.price_per_gram)}<span style={{ fontSize: '1rem', fontWeight: 300, marginLeft: 4, color: 'var(--gold-mid)' }}>/g</span></div>
                <div className="gold-updated">Actualizado: {new Date(goldPrice.updated_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</div>
              </div>
            </div>
            <div className="gold-banner-right">
              <div className="gold-input-wrap">
                <span>$</span>
                <input className="gold-input" type="number" min="0" step="0.01" value={goldInputVal} onChange={e => setGoldInputVal(e.target.value)} placeholder="95.00" />
              </div>
              <button className="btn btn-gold" onClick={handleSetGoldPrice} disabled={updatingGold}>{updatingGold ? <span className="spinner" /> : '💾'} Guardar</button>
              <button className="btn btn-ghost" onClick={handleRefreshGoldPrice} disabled={updatingGold}>{updatingGold ? <span className="spinner" /> : '🔄'} Sincronizar</button>
            </div>
          </div>
        )}

        <div className="page-header">
          <div>
            <div className="page-title">Catálogo de Piezas</div>
            <div className="page-subtitle">{products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {userRole === 'admin' && clients.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto', fontSize: '0.8rem', padding: '0.45rem 2rem 0.45rem 0.75rem' }}
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
              >
                <option value="all">Todas las joyerías</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <button className="btn btn-primary btn-lg" onClick={openAdd}>＋ Agregar Pieza</button>
          </div>
        </div>

        <div className="products-grid">
          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💍</div>
              <h3>Sin productos registrados</h3>
              <p>Agrega tu primera pieza de joyería para comenzar</p>
            </div>
          ) : (
            products.map(renderProductCard)
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingProduct ? 'Editar Pieza' : 'Nueva Pieza de Joyería'}</div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Nombre de la pieza *</label>
                  <input className="form-input" type="text" placeholder="Anillo solitario, Cadena figaro, etc." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gramos de oro *</label>
                  <input className="form-input" type="number" min="0.01" step="0.01" placeholder="5.5" value={form.grams} onChange={e => setForm(f => ({ ...f, grams: e.target.value }))} />
                  <span className="form-hint">Peso bruto de la pieza en gramos</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Kilataje</label>
                  <select className="form-select" value={form.karat} onChange={e => setForm(f => ({ ...f, karat: e.target.value }))}>
                    {([24, 18, 14, 10] as const).map(k => (<option key={k} value={k}>{KARAT_LABELS[k]}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mano de obra ($)</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="250.00" value={form.labor_cost} onChange={e => setForm(f => ({ ...f, labor_cost: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Margen de utilidad (%)</label>
                  <input className="form-input" type="number" min="0" max="999" step="0.1" placeholder="30" value={form.margin_percent} onChange={e => setForm(f => ({ ...f, margin_percent: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Extras / Adicionales ($)</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.extras} onChange={e => setForm(f => ({ ...f, extras: e.target.value }))} />
                  <span className="form-hint">Piedras, diseño, acabados</span>
                </div>
                <div className="form-group full">
                  <label className="form-label">Notas opcionales</label>
                  <textarea className="form-textarea" placeholder="Descripción, cliente, especificaciones..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              {previewCalc && goldPrice && (
                <div className="price-preview">
                  <div className="price-preview-label">Vista Previa del Precio</div>
                  <div className="price-preview-value">{formatCurrency(previewCalc.finalPrice)}</div>
                  <div className="price-preview-rows">
                    <div className="price-preview-row"><span>Valor oro ({(previewCalc.purity * 100).toFixed(1)}% de {parseFloat(form.grams)}g × {formatCurrency(goldPrice.price_per_gram)})</span><span>{formatCurrency(previewCalc.goldValue)}</span></div>
                    {previewCalc.laborCost > 0 && <div className="price-preview-row"><span>Mano de obra</span><span>{formatCurrency(previewCalc.laborCost)}</span></div>}
                    {previewCalc.extras > 0 && <div className="price-preview-row"><span>Extras</span><span>{formatCurrency(previewCalc.extras)}</span></div>}
                    <div className="price-preview-row"><span>Subtotal</span><span>{formatCurrency(previewCalc.subtotal)}</span></div>
                    {previewCalc.marginAmount > 0 && <div className="price-preview-row"><span>+ Margen ({form.margin_percent}%)</span><span>{formatCurrency(previewCalc.marginAmount)}</span></div>}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal} disabled={submitting}>Cancelar</button>
              <button className="btn btn-gold btn-lg" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="spinner" /> : null}
                {editingProduct ? 'Guardar Cambios' : 'Registrar Pieza'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'} {t.message}
          </div>
        ))}
      </div>
    </>
  )
}