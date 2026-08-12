import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { ClaimBadge, RepairBadge } from '../../components/Badges'

export default function Reports() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.dashboard().then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>

  const get = async (reportFn, filename) => {
    try {
      const res = await reportFn()
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      alert('Download failed: ' + e.message)
    }
  }

  const sd = stats.status_breakdown || {}
  const topReasons = stats.top_reasons || []
  const centerWorkload = stats.center_workload || []

  return (
    <>
      <h1 className="page-title">Reports & Analytics</h1>
      <p className="page-sub">Platform statistics and downloadable CSV reports</p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>👥</div>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.total_users}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--indigo-bg)', color: 'var(--indigo)' }}>📦</div>
          <div className="stat-label">Products</div>
          <div className="stat-value">{stats.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>📋</div>
          <div className="stat-label">Claims</div>
          <div className="stat-value">{stats.total_claims}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>🧾</div>
          <div className="stat-label">Invoices</div>
          <div className="stat-value">{stats.total_invoices}</div>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Claims by Status</h3>
          {Object.entries(sd).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
              <b>{v}</b>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Top Claim Reasons</h3>
          {topReasons.map((r) => (
            <div key={r.reason} style={{ padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{r.reason}</span>
                <b style={{ fontSize: 13 }}>{r.count}</b>
              </div>
              <div style={{ height: 5, background: 'var(--gray-100)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(r.count / (topReasons[0]?.count || 1)) * 100}%`,
                    height: '100%', background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 16 }}>Service Center Workload</h3>
          {centerWorkload.map((c) => (
            <div key={c.center} style={{ padding: '6px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{c.center}</span>
                <b style={{ fontSize: 13 }}>{c.count}</b>
              </div>
              <div style={{ height: 5, background: 'var(--gray-100)', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(c.count / (centerWorkload[0]?.count || 1)) * 100}%`,
                    height: '100%', background: 'var(--purple)',
                  }}
                />
              </div>
            </div>
          ))}
          {centerWorkload.length === 0 && <div className="empty-state">No assignments yet.</div>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Download Reports</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => get(api.claimsReport)}>📥 Claims Report (CSV)</button>
          <button className="btn btn-outline" onClick={() => get(api.productsReport)}>📥 Products Report (CSV)</button>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-400)' }}>
          Reports are generated server-side and include claim, product, customer and service center details.
        </div>
      </div>
    </>
  )
}
