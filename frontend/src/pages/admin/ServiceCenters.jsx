import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export default function ServiceCenters() {
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', email: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      setCenters(await api.listCenters())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    setMsg(''); setErr('')
    try {
      await api.createCenter(form)
      setMsg('Service center added successfully')
      setForm({ name: '', address: '', city: '', phone: '', email: '' })
      setShowForm(false)
      await load()
    } catch (e2) { setErr(e2.message) }
  }

  const toggleActive = async (c) => {
    try {
      await api.updateCenter(c.id, { is_active: !c.is_active })
      await load()
    } catch (e2) { alert(e2.message) }
  }

  const remove = async (c) => {
    if (!confirm(`Delete service center "${c.name}"?`)) return
    try {
      await api.deleteCenter(c.id)
      await load()
    } catch (e2) { alert(e2.message) }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Service Centers</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Manage authorized repair centers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Close' : '+ Add Service Center'}
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14 }}>Add a new service center</h3>
          <form onSubmit={create}>
            <div className="grid-2">
              <div className="field">
                <label>Center Name *</label>
                <input value={form.name} onChange={set('name')} required minLength={2} />
              </div>
              <div className="field">
                <label>City</label>
                <input value={form.city} onChange={set('city')} />
              </div>
              <div className="field">
                <label>Address</label>
                <input value={form.address} onChange={set('address')} />
              </div>
              <div className="field">
                <label>Phone</label>
                <input value={form.phone} onChange={set('phone')} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Add Service Center</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : centers.length === 0 ? (
        <div className="card empty-state">No service centers yet.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>City</th><th>Address</th><th>Phone</th>
                  <th>Rating</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.city || '—'}</td>
                    <td>{c.address || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>⭐ {c.rating.toFixed(1)}</td>
                    <td>
                      {c.is_active
                        ? <span className="badge badge-green">Active</span>
                        : <span className="badge badge-gray">Inactive</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-outline" onClick={() => toggleActive(c)}>
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => remove(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
