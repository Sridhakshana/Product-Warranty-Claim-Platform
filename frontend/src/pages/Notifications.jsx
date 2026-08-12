import { useEffect, useState } from 'react'
import { api } from '../api/client'

const CHANNEL_ICON = { app: '🔔', email: '📧', sms: '📱' }

export default function Notifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => api.notifications().then(setItems).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.markRead(id)
    load()
  }

  const markAll = async () => {
    await api.markAllRead()
    load()
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Email, SMS and in-app updates</p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={markAll}>Mark all as read</button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="card empty-state">No notifications yet.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markRead(n.id)}
              style={{
                display: 'flex', gap: 12, padding: '16px 20px',
                borderBottom: '1px solid var(--gray-100)', cursor: 'pointer',
                background: n.is_read ? '#fff' : 'var(--primary-light)',
              }}
            >
              <div style={{ fontSize: 20 }}>{CHANNEL_ICON[n.channel] || '🔔'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString()} · {n.channel.toUpperCase()}
                </div>
              </div>
              {!n.is_read && <span className="badge badge-blue">New</span>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
