import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { ClaimBadge, RepairBadge, ClaimProgress } from '../components/Badges'

export default function Claims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.listClaims().then(setClaims).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? claims : claims.filter((c) => c.claim_status === filter)

  return (
    <>
      <h1 className="page-title">My Claims</h1>
      <p className="page-sub">Track the status of your warranty claims</p>

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
        <div className="card empty-state">No claims found in this category.</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim No</th><th>Product</th><th>Reason</th><th>Status</th>
                  <th>Repair</th><th>Service Center</th><th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{c.claim_number}</td>
                    <td>{c.product_name}</td>
                    <td style={{ maxWidth: 220 }}>{c.claim_reason}</td>
                    <td><ClaimBadge status={c.claim_status} /></td>
                    <td><RepairBadge status={c.repair_status} /></td>
                    <td>{c.service_center_name || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Claim Lifecycle</h3>
          <ClaimProgress status={filtered[0].claim_status} />
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--gray-500)' }}>
            {filtered[0].admin_note ? `Admin note: ${filtered[0].admin_note}` : 'No admin notes yet.'}
          </div>
        </div>
      )}
    </>
  )
}
