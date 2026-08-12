import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const go = () => navigate(user ? '/dashboard' : '/login')

  const features = [
    { icon: '📦', title: 'Product Registration', desc: 'Register purchased products with warranty details instantly.' },
    { icon: '🛡️', title: 'Warranty Verification', desc: 'Automatic validity check with expiry dates and day countdown.' },
    { icon: '📋', title: 'Claim Submission', desc: 'Submit claims with duplicate-claim detection and full tracking.' },
    { icon: '🧾', title: 'Invoice Upload', desc: 'Upload purchase invoices for fast, verified claim approvals.' },
    { icon: '🔧', title: 'Service Centers', desc: 'Admin assigns claims to authorized service centers for repair.' },
    { icon: '📱', title: 'QR Verification', desc: 'Every product gets a unique QR code for instant verification.' },
    { icon: '🔔', title: 'Notifications', desc: 'Email, SMS and in-app alerts on every status change.' },
    { icon: '🤖', title: 'Support Chatbot', desc: '24/7 AI assistant answers warranty and claim questions.' },
    { icon: '📊', title: 'Reports & Analytics', desc: 'Admin dashboards, trend charts and CSV export reports.' },
  ]

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 1100 }}>
        <div className="hero">
          <div className="brand-row" style={{ marginBottom: 18 }}>
            <div className="brand-logo" style={{ background: 'rgba(255,255,255,0.2)' }}>🛡️</div>
            <span className="brand-name" style={{ color: '#fff' }}>Product Warranty Claim Processing Platform</span>
          </div>
          <h1>Digital, fast and transparent warranty claims</h1>
          <p>
            Register products, verify warranties, upload invoices, submit claims and track repairs —
            all from one platform. No more lost invoices, duplicate claims or status confusion.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700 }} onClick={go}>
              Get Started →
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
              onClick={() => navigate('/qr-verify')}
            >
              Verify a Product QR
            </button>
          </div>
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="fc-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
