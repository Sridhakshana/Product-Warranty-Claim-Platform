const MAP = {
  valid: { cls: 'badge-green', label: 'Valid', dot: '#16a34a' },
  expiring_soon: { cls: 'badge-yellow', label: 'Expiring Soon', dot: '#d97706' },
  expired: { cls: 'badge-red', label: 'Expired', dot: '#dc2626' },
}

export function WarrantyBadge({ status }) {
  const cfg = MAP[status] || { cls: 'badge-gray', label: status || 'Unknown', dot: '#64748b' }
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

const CLAIM_MAP = {
  pending: { cls: 'badge-yellow', label: 'Pending' },
  approved: { cls: 'badge-blue', label: 'Approved' },
  in_progress: { cls: 'badge-cyan', label: 'In Progress' },
  completed: { cls: 'badge-green', label: 'Completed' },
  rejected: { cls: 'badge-red', label: 'Rejected' },
}

const REPAIR_MAP = {
  not_started: { cls: 'badge-gray', label: 'Not Started' },
  received: { cls: 'badge-blue', label: 'Received' },
  in_repair: { cls: 'badge-yellow', label: 'In Repair' },
  repaired: { cls: 'badge-cyan', label: 'Repaired' },
  delivered: { cls: 'badge-green', label: 'Delivered' },
}

export function ClaimBadge({ status }) {
  const cfg = CLAIM_MAP[status] || { cls: 'badge-gray', label: status || 'Unknown' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

export function RepairBadge({ status }) {
  const cfg = REPAIR_MAP[status] || { cls: 'badge-gray', label: status || 'Unknown' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

export function RoleBadge({ role }) {
  const map = {
    admin: 'badge-purple',
    customer: 'badge-blue',
    service_center: 'badge-cyan',
  }
  return <span className={`badge ${map[role] || 'badge-gray'}`}>{role?.replace('_', ' ')}</span>
}

export function ClaimProgress({ status }) {
  const steps = ['pending', 'approved', 'in_progress', 'completed']
  const order = { rejected: 3 }
  let currentIdx = steps.indexOf(status)
  if (status === 'rejected') currentIdx = 3

  if (status === 'rejected') {
    return (
      <div className="progress-track">
        <span className="badge badge-red">Claim rejected</span>
      </div>
    )
  }

  const labels = ['Submitted', 'Approved', 'In Progress', 'Completed']
  return (
    <div className="progress-track">
      {steps.map((s, i) => (
        <div key={s} style={{ flex: 1 }}>
          <div className={`step-dot ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo'}`}>
            {i < currentIdx ? '✓' : i + 1}
          </div>
          <div className="progress-step">{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}
