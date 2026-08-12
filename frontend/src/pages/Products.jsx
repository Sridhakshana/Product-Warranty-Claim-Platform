import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { WarrantyBadge } from '../components/Badges'

function ProductModal({ product, onClose, onChanged }) {
  const [tab, setTab] = useState('overview')
  const [invoices, setInvoices] = useState([])
  const [uploading, setUploading] = useState(false)
  const [claimForm, setClaimForm] = useState({ claim_reason: '', description: '' })
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.productInvoices(product.id).then(setInvoices).catch(() => {})
  }, [product.id])

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMsg(null); setErr(null)
    try {
      const res = await api.uploadInvoice(product.id, file)
      setMsg(`Invoice uploaded${res.verified ? ' and verified' : ''} (${res.file_name})`)
      const inv = await api.productInvoices(product.id)
      setInvoices(inv)
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setUploading(false)
    }
  }

  const submitClaim = async (e) => {
    e.preventDefault()
    setMsg(null); setErr(null)
    try {
      const res = await api.createClaim({ product_id: product.id, ...claimForm })
      setMsg(`Claim ${res.claim.claim_number} submitted successfully!`)
      setClaimForm({ claim_reason: '', description: '' })
      onChanged && onChanged()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const w = product.warranty

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 20 }}>{product.product_name}</h2>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{product.product_code}</div>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>✕</button>
        </div>

        <div className="role-tabs">
          {['overview', 'warranty', 'invoice', 'claim'].map((t) => (
            <button key={t} className={`role-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Overview' : t === 'warranty' ? 'Warranty & QR' : t === 'invoice' ? 'Invoice' : 'Submit Claim'}
            </button>
          ))}
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {tab === 'overview' && (
          <div className="grid-2">
            <div>
              <div className="field"><label>Category</label><div>{product.category || '—'}</div></div>
              <div className="field"><label>Purchase Date</label><div>{product.purchase_date}</div></div>
              <div className="field"><label>Warranty Period</label><div>{product.warranty_period} months</div></div>
              <div className="field"><label>Warranty Status</label><div><WarrantyBadge status={w.status} /></div></div>
            </div>
            <div>
              <div className="field"><label>Warranty Expires</label><div>{w.warranty_end}</div></div>
              <div className="field"><label>Days Left</label><div style={{ fontSize: 24, fontWeight: 700, color: w.days_left > 0 ? 'var(--success)' : 'var(--danger)' }}>{w.days_left} days</div></div>
              <div className="field"><label>Invoices</label><div>{invoices.length} uploaded</div></div>
            </div>
          </div>
        )}

        {tab === 'warranty' && (
          <div className="grid-2">
            <div className="qr-box">
              <img src={product.qr_code} alt="QR" />
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-500)' }}>
                Scan to verify this product's warranty
              </div>
            </div>
            <div>
              <div className="field"><label>Status</label><div><WarrantyBadge status={w.status} /></div></div>
              <div className="field"><label>Warranty End</label><div>{w.warranty_end}</div></div>
              <div className="field"><label>Days Remaining</label><div style={{ fontWeight: 700 }}>{w.days_left}</div></div>
              <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 12 }}>
                💡 You can verify this product anywhere using the <b>QR Verify</b> page and the product code.
              </div>
            </div>
          </div>
        )}

        {tab === 'invoice' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <label className="btn btn-primary" style={{ position: 'relative', overflow: 'hidden' }}>
                {uploading ? 'Uploading…' : '📤 Upload Invoice'}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={upload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={uploading} />
              </label>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>PDF, PNG, JPG or TXT</span>
            </div>
            {invoices.length === 0 ? (
              <div className="empty-state">No invoices uploaded yet.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>File</th><th>Size</th><th>Verified</th><th>Uploaded</th></tr></thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>🧾 {inv.file_name}</td>
                        <td>{(inv.file_size / 1024).toFixed(1)} KB</td>
                        <td>
                          {inv.verified
                            ? <span className="badge badge-green">✓ Verified</span>
                            : <span className="badge badge-gray">Pending review</span>}
                        </td>
                        <td>{new Date(inv.upload_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'claim' && (
          <div>
            {w.status === 'expired' ? (
              <div className="alert alert-error">This product's warranty has expired, so you cannot submit a claim.</div>
            ) : (
              <form onSubmit={submitClaim}>
                <div className="field">
                  <label>Claim Reason *</label>
                  <input
                    value={claimForm.claim_reason}
                    onChange={(e) => setClaimForm({ ...claimForm, claim_reason: e.target.value })}
                    placeholder="e.g. Screen not working, battery drains fast"
                    required minLength={3}
                  />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={4}
                    value={claimForm.description}
                    onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                    placeholder="Describe the issue in detail…"
                  />
                </div>
                <button className="btn btn-primary" type="submit">Submit Warranty Claim</button>
              </form>
            )}
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--gray-400)' }}>
              Duplicate claims for the same product are automatically blocked.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({
    product_name: '', product_code: '', category: '', purchase_date: '', warranty_period: '24',
  })
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      setProducts(await api.listProducts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setErr(''); setMsg('')
    try {
      const res = await api.createProduct(form)
      setMsg(`Product registered! Warranty status: ${res.warranty.status}`)
      setForm({ product_name: '', product_code: '', category: '', purchase_date: '', warranty_period: '24' })
      setShowForm(false)
      setLoading(true)
      await load()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await api.deleteProduct(id)
      await load()
    } catch (e2) {
      alert(e2.message)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Register products and check warranty status</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ Register Product'}
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>Register a new product</h3>
          <form onSubmit={create}>
            <div className="grid-2">
              <div className="field">
                <label>Product Name *</label>
                <input value={form.product_name} onChange={set('product_name')} required minLength={2} />
              </div>
              <div className="field">
                <label>Product Code *</label>
                <input value={form.product_code} onChange={set('product_code')} placeholder="e.g. SAM-GAL-S24-001" required minLength={3} />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={set('category')}>
                  <option value="">Select category…</option>
                  <option>Mobile</option><option>Laptop</option><option>Television</option>
                  <option>Home Appliance</option><option>Audio</option><option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Purchase Date *</label>
                <input type="date" value={form.purchase_date} onChange={set('purchase_date')} required />
              </div>
              <div className="field">
                <label>Warranty Period (months) *</label>
                <select value={form.warranty_period} onChange={set('warranty_period')}>
                  {[3, 6, 12, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} months</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Register Product</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="card empty-state">You have no registered products yet.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Code</th><th>Category</th><th>Purchased</th>
                  <th>Warranty</th><th>Expires</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.product_code}</td>
                    <td>{p.category || '—'}</td>
                    <td>{p.purchase_date}</td>
                    <td><WarrantyBadge status={p.warranty.status} /></td>
                    <td>{p.warranty.warranty_end}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => setSelected(p)}>Details</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => remove(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && <ProductModal product={selected} onClose={() => setSelected(null)} onChanged={load} />}
    </>
  )
}
