import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { WarrantyBadge, ClaimBadge, ClaimProgress } from '../components/Badges'

function Stat({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `var(--${color}-bg)`, color: `var(--${color})` }}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [claims, setClaims] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (user.role === 'admin') {
          const d = await api.dashboard()
          setStats(d)
        } else if (user.role === 'customer') {
          const [p, c] = await Promise.all([api.listProducts(), api.listClaims()])
          setProducts(p)
          setClaims(c)
        } else {
          const c = await api.listClaims()
          setClaims(c)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.role])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  const firstName = (user?.full_name || '').split(' ')[0]

  if (user.role === 'admin') {
    const sd = stats?.status_breakdown || {}
    return (
      <>
        <h1 className="page-title">Welcome, {firstName} 👋</h1>
        <p className="page-sub">Platform overview and key metrics.</p>

        <div className="stat-grid">
          <Stat icon="👥" label="Total Users" value={stats?.total_users ?? 0} color="blue" />
          <Stat icon="📦" label="Registered Products" value={stats?.total_products ?? 0} color="indigo" />
          <Stat icon="📋" label="Total Claims" value={stats?.total_claims ?? 0} color="yellow" />
          <Stat icon="🔧" label="Active Service Centers" value={stats?.total_centers ?? 0} color="cyan" />
          <Stat icon="🧾" label="Invoices Uploaded" value={stats?.total_invoices ?? 0} color="green" />
        </div>

        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Claims by Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['pending', 'Pending', 'yellow'],
                ['approved', 'Approved', 'blue'],
                ['in_progress', 'In Progress', 'cyan'],
                ['completed', 'Completed', 'green'],
                ['rejected', 'Rejected', 'red'],
              ].map(([key, label, color]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge" style={{ background: `var(--${color}-bg)`, color: `var(--${color})`, minWidth: 90 }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${stats?.total_claims ? (sd[key] || 0) / stats.total_claims * 100 : 0}%`,
                        height: '100%', background: `var(--${color})`,
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 700 }}>{sd[key] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Claims (Last 6 Months)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {(stats?.claims_last_6_months?.labels || []).map((label, i) => {
                const count = stats.claims_last_6_months.counts[i]
                const max = Math.max(...stats.claims_last_6_months.counts, 1)
                return (
                  <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)' }}>{count}</div>
                    <div
                      style={{
                        height: `${Math.max((count / max) * 90, 4)}px`,
                        background: 'var(--primary)', borderRadius: '6px 6px 0 0',
                        transition: 'height 0.3s',
                      }}
                    />
                    <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 4 }}>{label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <Link className="btn btn-primary" to="/admin/claims">Manage Claims</Link>
          <Link className="btn btn-outline" to="/admin/reports">View Reports</Link>
        </div>
      </>
    )
  }

  if (user.role === 'service_center') {
    const active = claims.filter((c) => c.claim_status === 'approved' || c.claim_status === 'in_progress')
    return (
      <>
        <h1 className="page-title">Service Center Dashboard</h1>
        <p className="page-sub">Claims assigned to your center for repair.</p>
        <div className="stat-grid">
          <Stat icon="🔧" label="Assigned Claims" value={claims.length} color="blue" />
          <Stat icon="⚙️" label="Active Repairs" value={active.length} color="yellow" />
          <Stat icon="✅" label="Completed" value={claims.filter((c) => c.claim_status === 'completed').length} color="green" />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Recent Assignments</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Claim No</th><th>Product</th><th>Customer</th><th>Status</th><th>Repair</th><th></th>
                </tr>
              </thead>
              <tbody>
                {claims.slice(0, 6).map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.claim_number}</td>
                    <td>{c.product_name}</td>
                    <td>{c.user_name}</td>
                    <td><ClaimBadge status={c.claim_status} /></td>
                    <td>{c.repair_status}</td>
                    <td><Link className="btn btn-sm btn-outline" to="/service/claims">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )
  }

  // customer
  const valid = products.filter((p) => p.warranty.status === 'valid')
  const activeClaims = claims.filter((c) => ['pending', 'approved', 'in_progress'].includes(c.claim_status))

  return (
    <>
      <h1 className="page-title">Welcome, {firstName} 👋</h1>
      <p className="page-sub">Here's what's happening with your products and claims.</p>

      <div className="stat-grid">
        <Stat icon="📦" label="Registered Products" value={products.length} color="blue" />
        <Stat icon="✅" label="Under Warranty" value={valid.length} color="green" />
        <Stat icon="📋" label="Active Claims" value={activeClaims.length} color="yellow" />
        <Stat icon="🛡️" label="Total Claims" value={claims.length} color="indigo" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3>Recent Products</h3>
            <Link className="btn btn-sm btn-primary" to="/products">Manage</Link>
          </div>
          {products.length === 0 ? (
            <div className="empty-state">No products yet. <Link to="/products">Register your first product →</Link></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Code</th><th>Warranty</th></tr></thead>
                <tbody>
                  {products.slice(0, 4).map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.product_code}</td>
                      <td><WarrantyBadge status={p.warranty.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3>Recent Claims</h3>
            <Link className="btn btn-sm btn-primary" to="/claims">Track</Link>
          </div>
          {claims.length === 0 ? (
            <div className="empty-state">No claims yet. Submit one from your products page.</div>
          ) : (
            claims.slice(0, 3).map((c) => (
              <div key={c.id} style={{ borderBottom: '1px solid var(--gray-100)', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.claim_number}</span>
                  <ClaimBadge status={c.claim_status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>{c.product_name} — {c.claim_reason}</div>
                <ClaimProgress status={c.claim_status} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
