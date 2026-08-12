import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const fill = (email) => setForm({ email, password: 'password123' })

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-row">
          <div className="brand-logo">🛡️</div>
          <div>
            <div className="brand-name">Warranty Claim Platform</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Smart Product Warranty Processing</div>
          </div>
        </div>
        <h2>Welcome back</h2>
        <p className="auth-subtitle">Login to manage your products and warranty claims</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit">Login</button>
        </form>

        <div style={{ marginTop: 18, fontSize: 13, color: 'var(--gray-500)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>Demo accounts (password: password123)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm btn-outline" onClick={() => fill('customer@demo.com')}>Customer</button>
            <button className="btn btn-sm btn-outline" onClick={() => fill('admin@demo.com')}>Admin</button>
            <button className="btn btn-sm btn-outline" onClick={() => fill('service@demo.com')}>Service Center</button>
          </div>
        </div>
      </div>
    </div>
  )
}
