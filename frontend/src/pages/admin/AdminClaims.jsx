import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ClaimBadge, RepairBadge, ClaimProgress } from '../../components/Badges'

export default function AdminClaims() {
  const [claims, setClaims] = useState([])
  const [centers, setCenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [assignCenter, setAssignCenter] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const [c, centers] = await Promise.all([api.listClaims(), api.listCenters()])
    setClaims(c)
    setCenters(centers)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all' ? claims : claims.filter((c) => c.claim_status === filter)

  const assign = async (id) => {
    if (!assignCenter) { alert('Select a service center first'); return }
    try {
      await api.assignClaim(id, Number(assignCenter))
      alert('Claim assigned successfully')
      setSelected(null); setAssignCenter('')
      await load()
    } catch (e) { alert(e.message) }
  }

  const reject = async (id) => {
    if (!rejectNote.trim()) { alert('Enter a rejection reason'); return }
    try {
      await api.rejectClaim(id, rejectNote)
      alert('Claim rejected')
      setSelected(null); setRejectNote('')
      await load()
    } catch (e) { alert(e.message) }
  }

  const approve = async (id) => {
    try {
      await api.updateClaimStatus(id, { claim_status: 'approved' })
      await load()
    } catch (e) { alert(e.message) }
  }

  return (
    <>
      <h1 className="page-title">Manage Claims</h1>
      <p className="page-sub">Approve, reject and assign warranty claims to service centers</p>

      <div className="role-tabs">
        {['all', 'pending', 'approved', 'in_progress', 'completed', 'rejected'].map((s) => (
          <button key={s} className={`role-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">No claims in this category.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim No</th><th>Product</th><th>Customer</th><th>Reason</th>
                  <th>Status</th><th>Service Center</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.claim_number}</td>
                    <td>{c.product_name}</td>
                    <td>{c.user_name}</td>
                    <td style={{ maxWidth: 200 }}>{c.claim_reason}</td>
                    <td><ClaimBadge status={c.claim_status} /></td>
                    <td>{c.service_center_name || '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(c)}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setSelected(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20 }}>{selected.claim_number}</h2>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{selected.product_name} · {selected.user_name}</div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="field"><label>Claim Reason</label><div>{selected.claim_reason}</div></div>
              <div className="field"><label>Status</label><div><ClaimBadge status={selected.claim_status} /></div></div>
              <div className="field"><label>Description</label><div>{selected.description || '—'}</div></div>
              <div className="field"><label>Repair Status</label><div><RepairBadge status={selected.repair_status} /></div></div>
            </div>

            <ClaimProgress status={selected.claim_status} />

            <div style={{ marginTop: 20, borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
              <h3 style={{ marginBottom: 12, fontSize: 16 }}>Admin Actions</h3>

              {selected.claim_status === 'pending' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-success" onClick={() => approve(selected.id)}>✓ Approve</button>
                </div>
              )}

              {['approved', 'pending', 'in_progress'].includes(selected.claim_status) && (
                <div style={{ marginTop: 12 }}>
                  <div className="field">
                    <label>Assign to Service Center</label>
                    <select value={assignCenter} onChange={(e) => setAssignCenter(e.target.value)}>
                      <option value="">Select service center…</option>
                      {centers.filter((c) => c.is_active).map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary" onClick={() => assign(selected.id)}>Assign Claim</button>
                </div>
              )}

              {['pending', 'approved', 'in_progress'].includes(selected.claim_status) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
                  <div className="field">
                    <label>Reject Claim (reason)</label>
                    <textarea
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="e.g. No valid proof of purchase"
                    />
                  </div>
                  <button className="btn btn-danger" onClick={() => reject(selected.id)}>✕ Reject Claim</button>
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-500)' }}>
                Admin note: {selected.admin_note || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
