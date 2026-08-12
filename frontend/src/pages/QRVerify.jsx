import { useState } from 'react'
import { api } from '../api/client'
import { WarrantyBadge } from '../components/Badges'

export default function QRVerify() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    setErr(''); setResult(null)
    if (!code.trim()) return
    setLoading(true)
    try {
      setResult(await api.verifyQR(code.trim()))
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="page-title">QR Product Verification</h1>
      <p className="page-sub">Scan a product QR code or enter the product code to verify its warranty</p>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Verify a Product</h3>
          <form onSubmit={verify}>
            <div className="field">
              <label>Product Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SAM-GAL-S24-001"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying…' : '🔍 Verify Product'}
            </button>
          </form>
          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--gray-500)' }}>
            This page is public — retailers, customers and support staff can verify any
            registered product instantly without logging in.
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 14 }}>Verification Result</h3>
          {err && <div className="alert alert-error">{err}</div>}
          {!result && !err && (
            <div className="empty-state">
              <div style={{ fontSize: 40, marginBottom: 8 }}>📱</div>
              Enter a product code to see verification details.
            </div>
          )}
          {result && (
            <div>
              <div className="alert alert-success">✓ Product verified successfully</div>
              <div className="field"><label>Product</label><div style={{ fontWeight: 600, fontSize: 16 }}>{result.product_name}</div></div>
              <div className="field"><label>Product Code</label><div style={{ fontFamily: 'monospace' }}>{result.product_code}</div></div>
              <div className="field"><label>Category</label><div>{result.category || '—'}</div></div>
              <div className="field"><label>Warranty Status</label><div><WarrantyBadge status={result.warranty.status} /></div></div>
              <div className="field"><label>Purchased</label><div>{result.warranty.purchase_date}</div></div>
              <div className="field"><label>Warranty Expires</label><div>{result.warranty.warranty_end}</div></div>
              <div className="field"><label>Days Left</label><div style={{ fontWeight: 700 }}>{result.warranty.days_left}</div></div>
              {!result.under_warranty && (
                <div className="alert alert-error">This product is no longer under warranty.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
