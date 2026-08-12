import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await register(form)
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="brand-row">
          <div className="brand-logo">🛡️</div>
          <div>
            <div className="brand-name">Warranty Claim Platform</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Create a new account</div>
          </div>
        </div>
        <h2>Create account</h2>
        <p className="auth-subtitle">Register to register products and submit warranty claims</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={onSubmit}>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label>Full Name</label>
              <input value={form.full_name} onChange={set('full_name')} required minLength={2} />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={form.role} onChange={set('role')}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="service_center">Service Center</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label>Password (min 6 characters)</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="field">
              <label>Phone (optional)</label>
              <input value={form.phone} onChange={set('phone')} />
            </div>
            <div className="field">
              <label>Address (optional)</label>
              <input value={form.address} onChange={set('address')} />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit">Register</button>
        </form>

        <div style={{ marginTop: 18, fontSize: 13, color: 'var(--gray-500)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login</Link>
        </div>
      </div>
    </div>
  )
}
