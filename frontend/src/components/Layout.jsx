import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '../api/client'

const ROLE_LABELS = {
  customer: 'Customer',
  admin: 'Admin',
  service_center: 'Service Center',
}

const NAV = {
  customer: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/products', label: 'My Products', icon: '📦' },
    { to: '/claims', label: 'My Claims', icon: '📋' },
    { to: '/qr-verify', label: 'QR Verify', icon: '📱' },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/claims', label: 'Manage Claims', icon: '📋' },
    { to: '/admin/service-centers', label: 'Service Centers', icon: '🔧' },
    { to: '/admin/reports', label: 'Reports', icon: '📊' },
    { to: '/qr-verify', label: 'QR Verify', icon: '📱' },
  ],
  service_center: [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/service/claims', label: 'Assigned Claims', icon: '🔧' },
    { to: '/qr-verify', label: 'QR Verify', icon: '📱' },
  ],
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) return
    api.unreadCount().then((r) => setUnread(r.unread_count)).catch(() => {})
  }, [user])

  const nav = NAV[user?.role] || []
  const initials = (user?.full_name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">🛡️</div>
          <span>Warranty Portal</span>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>{ROLE_LABELS[user?.role]}</div>
          <div style={{ fontSize: 12 }}>{user?.email}</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>Product Warranty Claim Platform</h1>
          <div className="topbar-actions">
            <button
              className="notif-badge"
              title="Notifications"
              onClick={() => navigate('/notifications')}
            >
              🔔
              {unread > 0 && <span className="notif-count">{unread}</span>}
            </button>
            <div className="user-chip">
              <div className="avatar">{initials}</div>
              <span>{user?.full_name}</span>
            </div>
            <button className="logout-btn" title="Logout" onClick={onLogout}>⎋</button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
